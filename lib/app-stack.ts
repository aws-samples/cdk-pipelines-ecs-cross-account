import { StackProps, Stack, Duration } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as lb from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { DockerImageAsset } from 'aws-cdk-lib/aws-ecr-assets';
import * as path from 'path';

export interface AppStackProps extends StackProps {
    cluster: ecs.Cluster,
    greeting: string,
    bg: string
}

export class AppStack extends Stack {
    public readonly alb: lb.ApplicationLoadBalancer;
    private cluster: ecs.Cluster;
    constructor(scope: Construct, id: string, props: AppStackProps) {
      super(scope, id, props);

      const cluster = props.cluster;

      const asset = new DockerImageAsset(this, 'FlaskAppImage', {
        directory: path.join(__dirname, '..', 'src')
      });

      const fargateTaskDefinition = new ecs.FargateTaskDefinition(this, 'TaskDef', {
        memoryLimitMiB: 1024,
        cpu: 512
      });

      const container = new ecs.ContainerDefinition(this, 'FargateContainer', {
          image: ecs.EcrImage.fromDockerImageAsset(asset),
          taskDefinition: fargateTaskDefinition,
          environment: {
              'CUSTOM_ENVVAR': props.greeting,
              'BG_COLOR': props.bg
          },
          portMappings: [{ containerPort: 80 }]
      });

      const securityGroup = new ec2.SecurityGroup(this, 'FlaskAppAppSG', {
        allowAllOutbound: true,
        vpc: cluster.vpc
      });

      securityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80));

      const fargateEcsService = new ecs.FargateService(this, 'FargateService', {
          cluster: cluster,
          taskDefinition: fargateTaskDefinition,
          assignPublicIp: true,
          securityGroups: [ securityGroup ],
          desiredCount: 3,
          vpcSubnets: { subnets: cluster.vpc.privateSubnets }
      });

      const vpc = cluster.vpc;

      this.alb = new lb.ApplicationLoadBalancer(this, 'FlaskAppALB', {vpc, internetFacing: true});

      const listener = this.alb.addListener('Listener', { port: 80, protocol: lb.ApplicationProtocol.HTTP });

      listener.addTargets('EcsTG', {
          port: 80,
          targets: [fargateEcsService],
          protocol: lb.ApplicationProtocol.HTTP,
          healthCheck: {
              path: '/',
              interval: Duration.seconds(60)
          }
      });

    }
  }
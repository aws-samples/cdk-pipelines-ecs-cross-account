import{ CfnOutput, Stage, StageProps } from 'aws-cdk-lib';
import { AppStack } from './app-stack';
import { BaseStack } from './base-stack';
import { Construct } from 'constructs';

export interface baseStageProps extends StageProps {
    customGreeting: string,
    bg: string
}

export class BaseStage extends Stage {
    public readonly albAddress: CfnOutput
    constructor(scope: Construct, id: string, props: baseStageProps) {
        super(scope, id, props);

        const baseStack = new BaseStack(this, 'BaseStack');
        const appStack = new AppStack(this, 'AppStack', {
            cluster: baseStack.cluster,
            greeting: props.customGreeting,
            bg: props.bg
        });

        this.albAddress = new CfnOutput(appStack, 'AlbAddress', {
            value: `http://${appStack.alb.loadBalancerDnsName}/`
        });
    }
}
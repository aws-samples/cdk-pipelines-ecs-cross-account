import { Stack, StackProps, SecretValue } from 'aws-cdk-lib';
import { CodePipeline, CodePipelineSource, ShellStep, ManualApprovalStep } from 'aws-cdk-lib/pipelines';
import { Construct } from 'constructs';
import { BaseStage } from './base-stage';

const GITHUB_REPO = "";
const BRANCH_NAME = "";
const GITHUB_TOKEN = "";
const AWS_REGION = "";
const DEV_ACCOUNT_ID = "";
const STAGING_ACCOUNT_ID = "";
const PROD_ACCOUNT_ID = "";

export class CdkPipelineStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const pipeline = new CodePipeline(this, 'Pipeline', {
      crossAccountKeys: true,
      synth: new ShellStep('Synth', {
        input: CodePipelineSource.gitHub(GITHUB_REPO, BRANCH_NAME, {
          authentication: SecretValue.secretsManager(GITHUB_TOKEN)
        }),
        commands: ['npm ci', 'npm run build', 'npx cdk synth']
      })
    });

    const devStage = new BaseStage(this, 'DevStage', {
      env: {
        account: DEV_ACCOUNT_ID,
        region: AWS_REGION
      },
      customGreeting: 'Hi from Dev account',
      bg: '#FF0000'
    });

    const stagingStage = new BaseStage(this, 'StagingStage', {
      env: {
        account: STAGING_ACCOUNT_ID,
        region: AWS_REGION
      },
      customGreeting: 'Hi from Staging account',
      bg: '#00FF00'
    });

    const prodStage = new BaseStage(this, 'ProdStage', {
      env: {
        account: PROD_ACCOUNT_ID,
        region: AWS_REGION
      },
      customGreeting: 'Hi from Prod account',
      bg: '#0000FF'
    });
    

    const pipelineDevStage = pipeline.addStage(devStage);
    pipelineDevStage.addPost(new ShellStep("albTest", {
      envFromCfnOutputs: {albAddress: devStage.albAddress},
      commands: ['curl -f -s -o /dev/null -w "%{http_code}" $albAddress']
    }));

    const pipelineStagingStage = pipeline.addStage(stagingStage);
    pipelineStagingStage.addPost(new ShellStep("albTest", {
      envFromCfnOutputs: {albAddress: stagingStage.albAddress},
      commands: ['curl -f -s -o /dev/null -w "%{http_code}" $albAddress']
    }));

    
    const pipelineProdStage = pipeline.addStage(prodStage);   

    pipelineProdStage.addPre(new ManualApprovalStep('ManualApproval', {}));

  }
}

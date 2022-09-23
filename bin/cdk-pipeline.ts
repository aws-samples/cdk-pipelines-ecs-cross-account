#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { CdkPipelineStack } from '../lib/cdk-pipeline-stack';
import { Params } from '../lib/params';

const app = new cdk.App();
new CdkPipelineStack(app, 'CdkPipelineStack', {
  env: {
    account: Params.DEV_ACCOUNT_ID,
    region: Params.AWS_REGION
  }
});

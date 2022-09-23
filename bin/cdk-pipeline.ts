#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { CdkPipelineStack } from '../lib/cdk-pipeline-stack';

const AWS_REGION = "";
const DEV_ACCOUNT_ID = "";

const app = new cdk.App();
new CdkPipelineStack(app, 'CdkPipelineStack', {
  env: {
    account: DEV_ACCOUNT_ID,
    region: AWS_REGION
  }
});

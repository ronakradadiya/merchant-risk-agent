#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib'
import { MerchantRiskAgentStack } from '../lib/stack'

const app = new cdk.App()

new MerchantRiskAgentStack(app, 'MerchantRiskAgentStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.AWS_REGION || 'us-east-1',
  },
})

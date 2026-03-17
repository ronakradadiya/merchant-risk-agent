import * as cdk from 'aws-cdk-lib'
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb'
import * as logs from 'aws-cdk-lib/aws-logs'
import * as apigateway from 'aws-cdk-lib/aws-apigateway'
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs'
import { Runtime } from 'aws-cdk-lib/aws-lambda'
import { Construct } from 'constructs'
import * as path from 'path'

export class MerchantRiskAgentStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    // DynamoDB table for merchant reviews
    const reviewsTable = new dynamodb.Table(this, 'MerchantReviews', {
      tableName: 'merchant-reviews',
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'reviewedAt', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    })

    const sharedEnv = {
      DYNAMODB_TABLE_NAME: reviewsTable.tableName,
      NODE_OPTIONS: '--enable-source-maps',
    }

    const bundling = {
      minify: true,
      sourceMap: true,
      target: 'node20',
      externalModules: ['@aws-sdk/*'],
    }

    const backendEntry = (fn: string) =>
      path.join(__dirname, `../../backend/src/functions/${fn}/index.ts`)

    // Lambda: ReviewMerchant (POST /review-merchant)
    const reviewMerchantFn = new NodejsFunction(this, 'ReviewMerchantFn', {
      runtime: Runtime.NODEJS_20_X,
      entry: backendEntry('review-merchant'),
      handler: 'handler',
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      environment: {
        ...sharedEnv,
        OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
        SERPER_API_KEY: process.env.SERPER_API_KEY || '',
        WHOIS_API_KEY: process.env.WHOIS_API_KEY || '',
      },
      bundling,
      logRetention: logs.RetentionDays.ONE_WEEK,
    })

    // Lambda: GetReview (GET /review/:id)
    const getReviewFn = new NodejsFunction(this, 'GetReviewFn', {
      runtime: Runtime.NODEJS_20_X,
      entry: backendEntry('get-review'),
      handler: 'handler',
      timeout: cdk.Duration.seconds(5),
      memorySize: 128,
      environment: sharedEnv,
      bundling,
      logRetention: logs.RetentionDays.ONE_WEEK,
    })

    // Lambda: ListReviews (GET /reviews)
    const listReviewsFn = new NodejsFunction(this, 'ListReviewsFn', {
      runtime: Runtime.NODEJS_20_X,
      entry: backendEntry('list-reviews'),
      handler: 'handler',
      timeout: cdk.Duration.seconds(5),
      memorySize: 128,
      environment: sharedEnv,
      bundling,
      logRetention: logs.RetentionDays.ONE_WEEK,
    })

    // Grant DynamoDB access (least privilege)
    reviewsTable.grantReadWriteData(reviewMerchantFn)
    reviewsTable.grantReadData(getReviewFn)
    reviewsTable.grantReadData(listReviewsFn)

    // API Gateway
    const api = new apigateway.RestApi(this, 'MerchantRiskApi', {
      restApiName: 'Merchant Risk Agent API',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'Authorization'],
      },
    })

    // POST /review-merchant
    const reviewResource = api.root.addResource('review-merchant')
    reviewResource.addMethod('POST', new apigateway.LambdaIntegration(reviewMerchantFn))

    // GET /review/{id}
    const reviewDetailResource = api.root.addResource('review').addResource('{id}')
    reviewDetailResource.addMethod('GET', new apigateway.LambdaIntegration(getReviewFn))

    // GET /reviews
    const reviewsResource = api.root.addResource('reviews')
    reviewsResource.addMethod('GET', new apigateway.LambdaIntegration(listReviewsFn))

    // Outputs
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url,
      description: 'API Gateway endpoint URL',
    })

    new cdk.CfnOutput(this, 'TableName', {
      value: reviewsTable.tableName,
      description: 'DynamoDB table name',
    })
  }
}

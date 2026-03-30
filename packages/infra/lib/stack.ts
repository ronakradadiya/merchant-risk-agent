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

    const lambdaEnvironment = {
      DYNAMODB_TABLE_NAME: reviewsTable.tableName,
      NODE_OPTIONS: '--enable-source-maps',
      OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
      SERPER_API_KEY: process.env.SERPER_API_KEY || '',
      WHOIS_API_KEY: process.env.WHOIS_API_KEY || '',
    }

    const backendPath = path.join(__dirname, '../../backend/src')

    // Lambda: ReviewMerchant
    const reviewMerchantFn = new NodejsFunction(this, 'ReviewMerchantFn', {
      runtime: Runtime.NODEJS_20_X,
      entry: path.join(backendPath, 'functions/review-merchant/index.ts'),
      handler: 'handler',
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      environment: lambdaEnvironment,
      logRetention: logs.RetentionDays.ONE_WEEK,
      bundling: {
        externalModules: ['@aws-sdk/*'],
        sourceMap: true,
      },
    })

    // Lambda: GetReview
    const getReviewFn = new NodejsFunction(this, 'GetReviewFn', {
      runtime: Runtime.NODEJS_20_X,
      entry: path.join(backendPath, 'functions/get-review/index.ts'),
      handler: 'handler',
      timeout: cdk.Duration.seconds(5),
      memorySize: 128,
      environment: {
        DYNAMODB_TABLE_NAME: reviewsTable.tableName,
        NODE_OPTIONS: '--enable-source-maps',
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
      bundling: {
        externalModules: ['@aws-sdk/*'],
        sourceMap: true,
      },
    })

    // Lambda: ListReviews
    const listReviewsFn = new NodejsFunction(this, 'ListReviewsFn', {
      runtime: Runtime.NODEJS_20_X,
      entry: path.join(backendPath, 'functions/list-reviews/index.ts'),
      handler: 'handler',
      timeout: cdk.Duration.seconds(5),
      memorySize: 128,
      environment: {
        DYNAMODB_TABLE_NAME: reviewsTable.tableName,
        NODE_OPTIONS: '--enable-source-maps',
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
      bundling: {
        externalModules: ['@aws-sdk/*'],
        sourceMap: true,
      },
    })

    // Lambda: GetAnalytics
    const getAnalyticsFn = new NodejsFunction(this, 'GetAnalyticsFn', {
      runtime: Runtime.NODEJS_20_X,
      entry: path.join(backendPath, 'functions/get-analytics/index.ts'),
      handler: 'handler',
      timeout: cdk.Duration.seconds(10),
      memorySize: 128,
      environment: {
        DYNAMODB_TABLE_NAME: reviewsTable.tableName,
        NODE_OPTIONS: '--enable-source-maps',
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
      bundling: {
        externalModules: ['@aws-sdk/*'],
        sourceMap: true,
      },
    })

    // Grant DynamoDB access
    reviewsTable.grantReadWriteData(reviewMerchantFn)
    reviewsTable.grantReadData(getReviewFn)
    reviewsTable.grantReadData(listReviewsFn)
    reviewsTable.grantReadData(getAnalyticsFn)

    // API Gateway
    const api = new apigateway.RestApi(this, 'MerchantRiskApi', {
      restApiName: 'Merchant Risk Agent API',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
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

    // GET /analytics
    const analyticsResource = api.root.addResource('analytics')
    analyticsResource.addMethod('GET', new apigateway.LambdaIntegration(getAnalyticsFn))

    // Outputs
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url,
      description: 'API Gateway URL',
    })
  }
}

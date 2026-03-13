import * as cdk from 'aws-cdk-lib'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as apigateway from 'aws-cdk-lib/aws-apigateway'
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb'
import * as logs from 'aws-cdk-lib/aws-logs'
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
      AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
    }

    // Lambda: ReviewMerchant
    const reviewMerchantFn = new lambda.Function(this, 'ReviewMerchantFn', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../backend/dist/functions/review-merchant')),
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      environment: {
        ...lambdaEnvironment,
        OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
        SERPER_API_KEY: process.env.SERPER_API_KEY || '',
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
    })

    // Lambda: GetReview
    const getReviewFn = new lambda.Function(this, 'GetReviewFn', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../backend/dist/functions/get-review')),
      timeout: cdk.Duration.seconds(5),
      memorySize: 128,
      environment: lambdaEnvironment,
      logRetention: logs.RetentionDays.ONE_WEEK,
    })

    // Lambda: ListReviews
    const listReviewsFn = new lambda.Function(this, 'ListReviewsFn', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../backend/dist/functions/list-reviews')),
      timeout: cdk.Duration.seconds(5),
      memorySize: 128,
      environment: lambdaEnvironment,
      logRetention: logs.RetentionDays.ONE_WEEK,
    })

    // Grant DynamoDB access
    reviewsTable.grantReadWriteData(reviewMerchantFn)
    reviewsTable.grantReadData(getReviewFn)
    reviewsTable.grantReadData(listReviewsFn)

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

    // Outputs
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url,
      description: 'API Gateway URL',
    })
  }
}

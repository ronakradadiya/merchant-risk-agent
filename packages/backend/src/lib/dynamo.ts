import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, PutCommand, ScanCommand } from '@aws-sdk/lib-dynamodb'
import { RiskDecision } from '@merchant-risk-agent/shared'

const client = new DynamoDBClient({})
const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: { removeUndefinedValues: true },
})

const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || 'merchant-reviews'

export async function saveDynamoReview(decision: RiskDecision): Promise<void> {
  await docClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: decision,
    })
  )
}

export async function getDynamoReview(id: string): Promise<RiskDecision | null> {
  // Since we need the sort key (reviewedAt) but only have the id,
  // we scan with a filter. For production scale, add a GSI on id.
  const result = await docClient.send(
    new ScanCommand({
      TableName: TABLE_NAME,
      FilterExpression: 'id = :id',
      ExpressionAttributeValues: { ':id': id },
    })
  )
  return (result.Items?.[0] as RiskDecision) || null
}

export async function listDynamoReviews(): Promise<RiskDecision[]> {
  const result = await docClient.send(
    new ScanCommand({
      TableName: TABLE_NAME,
    })
  )
  const items = (result.Items || []) as RiskDecision[]
  return items.sort(
    (a, b) => new Date(b.reviewedAt).getTime() - new Date(a.reviewedAt).getTime()
  )
}

export async function listDynamoReviewsSince(since: string): Promise<RiskDecision[]> {
  const result = await docClient.send(
    new ScanCommand({
      TableName: TABLE_NAME,
      FilterExpression: 'reviewedAt >= :since',
      ExpressionAttributeValues: { ':since': since },
    })
  )
  return (result.Items || []) as RiskDecision[]
}

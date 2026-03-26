import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { listDynamoReviews } from '../../lib/dynamo'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders, body: '' }
  }

  try {
    const reviews = await listDynamoReviews()
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify(reviews),
    }
  } catch (err) {
    console.error('List reviews failed:', err)
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Internal server error' }),
    }
  }
}

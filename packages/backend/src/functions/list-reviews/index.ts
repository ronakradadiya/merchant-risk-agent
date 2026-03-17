import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { listReviews } from '../../store'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET,OPTIONS',
}

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: CORS_HEADERS, body: '' }
  }

  try {
    const reviews = await listReviews()
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify(reviews),
    }
  } catch (err) {
    console.error('List reviews failed:', err)
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Failed to list reviews' }),
    }
  }
}

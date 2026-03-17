import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { MerchantInputSchema } from '@merchant-risk-agent/shared'
import { classifyMerchant } from '../../agents/classifier'
import { saveReview } from '../../store'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST,OPTIONS',
}

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: CORS_HEADERS, body: '' }
  }

  try {
    const body = JSON.parse(event.body || '{}')
    const parsed = MerchantInputSchema.safeParse(body)

    if (!parsed.success) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: 'Validation failed', details: parsed.error.flatten() }),
      }
    }

    const decision = await classifyMerchant(parsed.data)
    await saveReview(decision)

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify(decision),
    }
  } catch (err) {
    console.error('Classification failed:', err)
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        error: 'Classification failed',
        message: err instanceof Error ? err.message : 'Unknown error',
      }),
    }
  }
}

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { listDynamoReviews, listDynamoReviewsSince } from '../../lib/dynamo'
import { INDIA_UPI_FRAUD_POLICIES } from '../../policies/india-upi-fraud'

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
    const since30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const [allReviews, last30Reviews] = await Promise.all([
      listDynamoReviews(),
      listDynamoReviewsSince(since30Days),
    ])

    const total = allReviews.length
    const last30 = last30Reviews.length

    // Policy trigger frequency over last 30 days
    const policyCounts: Record<string, number> = {}
    for (const policy of INDIA_UPI_FRAUD_POLICIES) {
      policyCounts[policy.id] = 0
    }
    for (const review of last30Reviews) {
      for (const triggered of review.policiesTriggered || []) {
        const id = triggered.split(':')[0].trim()
        if (policyCounts[id] !== undefined) {
          policyCounts[id]++
        }
      }
    }

    const policyFrequency = INDIA_UPI_FRAUD_POLICIES.map((p) => ({
      policyId: p.id,
      policyName: p.name,
      count: policyCounts[p.id] ?? 0,
      percentage: last30 > 0 ? Math.round(((policyCounts[p.id] ?? 0) / last30) * 100) : 0,
    })).sort((a, b) => b.count - a.count)

    // Verdict breakdown over last 30 days
    const verdictBreakdown = { approve: 0, review: 0, reject: 0 }
    for (const review of last30Reviews) {
      const action = review.recommendedAction as keyof typeof verdictBreakdown
      if (action in verdictBreakdown) verdictBreakdown[action]++
    }

    const scores = last30Reviews.map((r) => r.riskScore).filter((s) => s != null)
    const avgRiskScore = scores.length > 0
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : 0

    const confidences = last30Reviews
      .map((r) => (r as any).confidenceScore)
      .filter((c) => c != null)
    const avgConfidence = confidences.length > 0
      ? Math.round(confidences.reduce((a: number, b: number) => a + b, 0) / confidences.length)
      : 0

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        totalReviews: total,
        last30Days: last30,
        policyFrequency,
        verdictBreakdown,
        avgRiskScore,
        avgConfidence,
      }),
    }
  } catch (err) {
    console.error('Analytics failed:', err)
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Internal server error' }),
    }
  }
}

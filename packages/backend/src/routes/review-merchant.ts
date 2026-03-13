import { Router } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { MerchantInputSchema, RiskDecision } from '@merchant-risk-agent/shared'
import { saveReview } from '../store'

export const reviewMerchantRouter = Router()

reviewMerchantRouter.post('/review-merchant', async (req, res) => {
  const startTime = Date.now()

  // Validate input with Zod
  const parsed = MerchantInputSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({
      error: 'Validation failed',
      details: parsed.error.flatten(),
    })
    return
  }

  const input = parsed.data

  // Mock risk classification — replaced by GPT-4o classifier on Day 2
  const riskScore = generateMockRiskScore(input)
  const riskLevel = riskScore >= 70 ? 'high' : riskScore >= 40 ? 'medium' : 'low'
  const recommendedAction = riskScore >= 70 ? 'reject' : riskScore >= 40 ? 'review' : 'approve'

  const decision: RiskDecision = {
    id: uuidv4(),
    merchantInput: input,
    riskScore,
    riskLevel,
    recommendedAction,
    policiesTriggered: getMockTriggeredPolicies(input),
    policiesPassed: getMockPassedPolicies(input),
    toolSignals: {
      domainAgeDays: input.websiteUrl ? Math.floor(Math.random() * 365) : undefined,
      hasSSL: input.websiteUrl ? Math.random() > 0.3 : undefined,
      googleIndexedPages: input.websiteUrl ? Math.floor(Math.random() * 100) : undefined,
      publicComplaints: Math.floor(Math.random() * 5),
      upiTyposquatMatch: false,
      typosquatConfidence: 0,
    },
    reasoning: `Mock analysis: Merchant "${input.merchantName}" with UPI ID ${input.upiId} ` +
      `has been operating for ${input.accountAgeDays} days with ${input.transactionVolume30d} ` +
      `transactions in the last 30 days. Risk score: ${riskScore}/100.`,
    reviewedAt: new Date().toISOString(),
    reviewDurationMs: Date.now() - startTime,
  }

  saveReview(decision)
  res.json(decision)
})

function generateMockRiskScore(input: { accountAgeDays: number; transactionVolume30d: number; avgTransactionINR: number }): number {
  let score = 0
  if (input.accountAgeDays < 30) score += 30
  if (input.transactionVolume30d > 500) score += 25
  if (input.avgTransactionINR > 10000) score += 20
  score += Math.floor(Math.random() * 15)
  return Math.min(score, 100)
}

function getMockTriggeredPolicies(input: { accountAgeDays: number; transactionVolume30d: number; avgTransactionINR: number }): string[] {
  const triggered: string[] = []
  if (input.accountAgeDays < 30 && input.transactionVolume30d > 500) {
    triggered.push('P1: New account high velocity')
  }
  if (input.accountAgeDays < 60 && input.avgTransactionINR > 10000) {
    triggered.push('P3: High-ticket electronics new account')
  }
  return triggered
}

function getMockPassedPolicies(input: { accountAgeDays: number; transactionVolume30d: number; avgTransactionINR: number }): string[] {
  const all = ['P1', 'P2', 'P3', 'P4', 'P5', 'P6']
  const triggered = getMockTriggeredPolicies(input).map(p => p.split(':')[0])
  return all.filter(p => !triggered.includes(p))
}

import { RiskDecision } from '@merchant-risk-agent/shared'

// In-memory store for local dev — replaced by DynamoDB in production
const reviews = new Map<string, RiskDecision>()

export function saveReview(decision: RiskDecision): void {
  reviews.set(decision.id, decision)
}

export function getReview(id: string): RiskDecision | undefined {
  return reviews.get(id)
}

export function listReviews(): RiskDecision[] {
  return Array.from(reviews.values()).sort(
    (a, b) => new Date(b.reviewedAt).getTime() - new Date(a.reviewedAt).getTime()
  )
}

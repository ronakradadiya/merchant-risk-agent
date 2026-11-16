import { RiskDecision } from '@merchant-risk-agent/shared'

// In-memory store
const memoryStore = new Map<string, RiskDecision>()

export async function saveReview(decision: RiskDecision): Promise<void> {
  memoryStore.set(decision.id, decision)
}

export async function getReview(id: string): Promise<RiskDecision | undefined> {
  return memoryStore.get(id)
}

export async function listReviews(): Promise<RiskDecision[]> {
  return Array.from(memoryStore.values()).sort(
    (a, b) => new Date(b.reviewedAt).getTime() - new Date(a.reviewedAt).getTime()
  )
}

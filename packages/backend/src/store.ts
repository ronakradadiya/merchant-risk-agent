import { RiskDecision } from '@merchant-risk-agent/shared'
import { saveDynamoReview, getDynamoReview, listDynamoReviews } from './lib/dynamo'

const useDynamo = !!process.env.DYNAMODB_TABLE_NAME

// In-memory store for local dev
const memoryStore = new Map<string, RiskDecision>()

export async function saveReview(decision: RiskDecision): Promise<void> {
  if (useDynamo) {
    await saveDynamoReview(decision)
  } else {
    memoryStore.set(decision.id, decision)
  }
}

export async function getReview(id: string): Promise<RiskDecision | undefined> {
  if (useDynamo) {
    return (await getDynamoReview(id)) ?? undefined
  }
  return memoryStore.get(id)
}

export async function listReviews(): Promise<RiskDecision[]> {
  if (useDynamo) {
    return listDynamoReviews()
  }
  return Array.from(memoryStore.values()).sort(
    (a, b) => new Date(b.reviewedAt).getTime() - new Date(a.reviewedAt).getTime()
  )
}

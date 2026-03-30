// Seeds all 15 test cases into DynamoDB by calling the live API
// Run: API_URL=https://... npx ts-node --project scripts/tsconfig.json scripts/seed-test-cases.ts

import { TEST_CASES } from './test-cases'

const API_URL = (process.env.API_URL || 'http://localhost:3001').replace(/\/$/, '')

async function seedCase(input: Record<string, unknown>, description: string) {
  const res = await fetch(`${API_URL}/review-merchant`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`HTTP ${res.status}: ${text}`)
  }
  const data = (await res.json()) as { id: string; riskScore: number; recommendedAction: string }
  console.log(`✓ ${description}`)
  console.log(`  → ${data.recommendedAction.toUpperCase()} (score: ${data.riskScore}) id: ${data.id}`)
}

async function seed() {
  console.log(`\n🌱 Seeding ${TEST_CASES.length} test cases → ${API_URL}\n`)

  for (const tc of TEST_CASES) {
    try {
      await seedCase(tc.input as Record<string, unknown>, `${tc.id}: ${tc.description}`)
    } catch (err) {
      console.error(`✗ ${tc.id} failed:`, err instanceof Error ? err.message : err)
    }
    // Small delay to avoid Lambda throttling
    await new Promise((r) => setTimeout(r, 500))
  }

  console.log('\n✅ Seeding complete — check /history to verify')
}

seed().catch(console.error)

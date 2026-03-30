// Run: API_URL=https://your-live-url.com npx ts-node scripts/evaluate.ts
// Or:  API_URL=http://localhost:3001 npx ts-node scripts/evaluate.ts

import { TEST_CASES } from './test-cases'

const API_URL = (process.env.API_URL || 'http://localhost:3001').replace(/\/$/, '')
const RUNS_PER_CASE = 3

interface ReviewResult {
  recommendedAction: string
  riskScore: number
  confidenceScore?: number
  [key: string]: unknown
}

async function reviewMerchant(input: Record<string, unknown>): Promise<ReviewResult> {
  const start = Date.now()
  const res = await fetch(`${API_URL}/review-merchant`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`HTTP ${res.status}: ${text}`)
  }
  const data = (await res.json()) as ReviewResult
  return { ...data, durationMs: Date.now() - start }
}

function mode(arr: string[]): string {
  const freq: Record<string, number> = {}
  for (const v of arr) freq[v] = (freq[v] || 0) + 1
  return Object.entries(freq).sort((a, b) => b[1] - a[1])[0][0]
}

async function runEvaluation() {
  console.log(`\n🧪 Evaluation — ${TEST_CASES.length} cases × ${RUNS_PER_CASE} runs`)
  console.log(`   API: ${API_URL}\n`)

  const results: {
    id: string
    description: string
    expected: string
    got: string
    correct: boolean
    verdictConsistent: boolean
    avgScore: number
    variance: number
    avgConfidence: number
  }[] = []

  for (const tc of TEST_CASES) {
    process.stdout.write(`  Running ${tc.id}...`)
    const runs: ReviewResult[] = []

    for (let i = 0; i < RUNS_PER_CASE; i++) {
      try {
        const result = await reviewMerchant(tc.input as Record<string, unknown>)
        runs.push(result)
        process.stdout.write(` ${i + 1}`)
      } catch (err) {
        console.error(`\n  ✗ ${tc.id} run ${i + 1} failed:`, err)
        runs.push({ recommendedAction: 'error', riskScore: 0 } as ReviewResult)
      }
    }

    const verdicts = runs.map((r) => r.recommendedAction)
    const majorityVerdict = mode(verdicts)
    const verdictConsistent = verdicts.every((v) => v === verdicts[0])
    const scores = runs.map((r) => r.riskScore)
    const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    const variance = Math.max(...scores) - Math.min(...scores)
    const confidences = runs.map((r) => r.confidenceScore ?? 0)
    const avgConfidence = Math.round(confidences.reduce((a, b) => a + b, 0) / confidences.length)
    const correct = majorityVerdict === tc.expectedVerdict

    results.push({
      id: tc.id,
      description: tc.description,
      expected: tc.expectedVerdict,
      got: majorityVerdict,
      correct,
      verdictConsistent,
      avgScore,
      variance,
      avgConfidence,
    })

    const icon = correct ? '✓' : '✗'
    console.log(`\n${icon} ${tc.id} — ${tc.description}`)
    console.log(`  Expected: ${tc.expectedVerdict.padEnd(7)} | Got: ${majorityVerdict.padEnd(7)} | Score: ${String(avgScore).padStart(3)} ±${variance} | Confidence: ${avgConfidence}%`)
    if (!verdictConsistent) {
      console.log(`  ⚠️  INCONSISTENT verdicts: ${verdicts.join(', ')}`)
    }
  }

  const correctCount = results.filter((r) => r.correct).length
  const accuracy = Math.round((correctCount / results.length) * 100)
  const avgVariance = Math.round(results.reduce((a, b) => a + b.variance, 0) / results.length)
  const inconsistentCount = results.filter((r) => !r.verdictConsistent).length
  const avgConf = Math.round(results.reduce((a, b) => a + b.avgConfidence, 0) / results.length)

  console.log('\n' + '─'.repeat(60))
  console.log(`\n📊 EVALUATION RESULTS`)
  console.log(`Accuracy:            ${correctCount}/${results.length} (${accuracy}%)`)
  console.log(`Avg score variance:  ±${avgVariance} across ${RUNS_PER_CASE} runs`)
  console.log(`Inconsistent:        ${inconsistentCount}/${results.length} cases`)
  console.log(`Avg confidence:      ${avgConf}%`)

  const failures = results.filter((r) => !r.correct)
  if (failures.length > 0) {
    console.log(`\n❌ Failing cases:`)
    for (const f of failures) {
      console.log(`  ${f.id}: expected ${f.expected}, got ${f.got} — ${f.description}`)
    }
  }

  if (accuracy >= 80) {
    console.log(`\n✅ Ready for demo (${accuracy}% ≥ 80%)`)
  } else {
    console.log(`\n⚠️  Below 80% — refine failing policies before sending email`)
  }
}

runEvaluation().catch(console.error)

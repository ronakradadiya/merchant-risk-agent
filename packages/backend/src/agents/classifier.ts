import { v4 as uuidv4 } from 'uuid'
import { MerchantInput, RiskDecision } from '@merchant-risk-agent/shared'
import { Policy } from '@merchant-risk-agent/shared'
import { openai } from '../lib/openai'
import { INDIA_UPI_FRAUD_POLICIES } from '../policies/india-upi-fraud'

function buildSystemPrompt(policies: Policy[]): string {
  const policyBlock = policies
    .map(
      (p) =>
        `[${p.id}] ${p.name} (severity: ${p.severity})\n${p.rule.trim()}`
    )
    .join('\n\n')

  return `You are a UPI merchant fraud risk analyst. Your job is to evaluate merchant profiles against fraud policies and return a structured risk decision.

## Fraud Policies
${policyBlock}

## Instructions
1. Evaluate the merchant profile against ALL 6 policies.
2. For each policy, determine if it is triggered or passed based on the merchant data provided.
3. Calculate a risk score from 0-100 based on the severity and number of policies triggered:
   - critical policy triggered: +25-30 points each
   - high policy triggered: +15-20 points each
   - medium policy triggered: +8-12 points each
   - No policies triggered: score should be 5-15
4. Determine risk level: low (0-39), medium (40-69), high (70-100)
5. Determine recommended action: approve (low), review (medium), reject (high)
6. Provide clear reasoning explaining your assessment.

## Output Format
You MUST respond with ONLY a valid JSON object (no markdown, no code fences) with this exact structure:
{
  "riskScore": <number 0-100>,
  "riskLevel": "low" | "medium" | "high",
  "recommendedAction": "approve" | "review" | "reject",
  "policiesTriggered": ["<policyId>: <policyName> - <brief reason>", ...],
  "policiesPassed": ["<policyId>: <policyName>", ...],
  "reasoning": "<2-3 sentence explanation of the overall risk assessment>"
}`
}

function buildUserMessage(input: MerchantInput): string {
  return `Evaluate this merchant for fraud risk:

Merchant Name: ${input.merchantName}
UPI ID: ${input.upiId}
Business Type: ${input.businessType}
Account Age: ${input.accountAgeDays} days
Average Transaction: ₹${input.avgTransactionINR.toLocaleString('en-IN')}
Transaction Volume (30d): ${input.transactionVolume30d}
Location: ${input.location}
Website: ${input.websiteUrl || 'Not provided'}
Phone: ${input.phoneNumber || 'Not provided'}
GST Number: ${input.gstNumber || 'Not provided'}`
}

export async function classifyMerchant(input: MerchantInput): Promise<RiskDecision> {
  const startTime = Date.now()

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: buildSystemPrompt(INDIA_UPI_FRAUD_POLICIES) },
      { role: 'user', content: buildUserMessage(input) },
    ],
    temperature: 0.1,
    max_tokens: 1000,
  })

  const content = response.choices[0].message.content
  if (!content) {
    throw new Error('Empty response from GPT-4o')
  }

  const parsed = JSON.parse(content)

  const decision: RiskDecision = {
    id: uuidv4(),
    merchantInput: input,
    riskScore: parsed.riskScore,
    riskLevel: parsed.riskLevel,
    recommendedAction: parsed.recommendedAction,
    policiesTriggered: parsed.policiesTriggered,
    policiesPassed: parsed.policiesPassed,
    toolSignals: {},
    reasoning: parsed.reasoning,
    reviewedAt: new Date().toISOString(),
    reviewDurationMs: Date.now() - startTime,
  }

  return decision
}

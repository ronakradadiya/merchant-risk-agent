import { v4 as uuidv4 } from 'uuid'
import { MerchantInput, RiskDecision, ToolSignals } from '@merchant-risk-agent/shared'
import { Policy } from '@merchant-risk-agent/shared'
import { openai } from '../lib/openai'
import { INDIA_UPI_FRAUD_POLICIES } from '../policies/india-upi-fraud'
import { TOOL_DEFINITIONS, executeTool } from './tools'
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions'

const MAX_TOOL_ROUNDS = 5

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

## Available Tools
You have access to 4 investigative tools. USE THEM before making your final decision:
1. check_domain_age — Check a merchant's website domain registration date, SSL, and Google indexing (for P4)
2. web_search — Search for fraud reports, complaints, or scam alerts about the merchant (for P1, P3)
3. check_upi_pattern — Analyze the UPI VPA for typosquatting, brand impersonation, or scam patterns (for P2)
4. check_india_compliance — Check location consistency via phone prefix + IP geolocation + server hosting, and GST compliance via GSTIN format validation + state code match + active status lookup (for P5, P6)

## Instructions
1. First, call the relevant tools to gather signals. You should call check_upi_pattern for every merchant. Call check_domain_age if a website URL is provided. Call web_search to look for fraud complaints. Call check_india_compliance to verify location and GST signals for P5 and P6.
2. After receiving tool results, evaluate the merchant against ALL 7 policies using both the merchant data and tool signals. P7 (AI-generated profile) requires no tool — evaluate it directly from the merchant input text.
3. Calculate a risk score from 0-100 based on the severity and number of policies triggered:
   - critical policy triggered: +25-30 points each
   - high policy triggered: +15-20 points each
   - medium policy triggered: +8-12 points each
   - No policies triggered: score should be 5-15
4. Determine risk level: low (0-39), medium (40-69), high (70-100)
5. Determine recommended action: approve (low), review (medium), reject (high)

## Final Output Format
When you have gathered enough information and are ready to decide, respond with ONLY a valid JSON object (no markdown, no code fences):
{
  "riskScore": <number 0-100>,
  "riskLevel": "low" | "medium" | "high",
  "recommendedAction": "approve" | "review" | "reject",
  "policiesTriggered": ["<policyId>: <policyName> - <brief reason>", ...],
  "policiesPassed": ["<policyId>: <policyName>", ...],
  "reasoning": "<2-3 sentence explanation incorporating tool findings>"
}`
}

function buildUserMessage(input: MerchantInput): string {
  return `Evaluate this merchant for fraud risk. Use the available tools to investigate before making your decision.

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
  const messages: ChatCompletionMessageParam[] = [
    { role: 'user', content: buildUserMessage(input) },
  ]
  const toolSignals: ToolSignals = {}

  // Agentic loop
  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: buildSystemPrompt(INDIA_UPI_FRAUD_POLICIES) },
        ...messages,
      ],
      tools: TOOL_DEFINITIONS,
      tool_choice: 'auto',
      temperature: 0.1,
    })

    const message = response.choices[0].message

    // No tool calls = LLM is ready to decide
    if (!message.tool_calls || message.tool_calls.length === 0) {
      const content = message.content
      if (!content) {
        throw new Error('Empty response from GPT-4o')
      }

      console.log(`[classifier] Final decision after ${round} tool round(s)`)
      const parsed = JSON.parse(content)

      return {
        id: uuidv4(),
        merchantInput: input,
        riskScore: parsed.riskScore,
        riskLevel: parsed.riskLevel,
        recommendedAction: parsed.recommendedAction,
        policiesTriggered: parsed.policiesTriggered,
        policiesPassed: parsed.policiesPassed,
        toolSignals,
        reasoning: parsed.reasoning,
        reviewedAt: new Date().toISOString(),
        reviewDurationMs: Date.now() - startTime,
      }
    }

    // Execute each tool call and feed results back
    const toolCalls = message.tool_calls.filter(
      (tc): tc is typeof tc & { type: 'function'; function: { name: string; arguments: string } } =>
        tc.type === 'function'
    )

    console.log(`[classifier] Round ${round + 1}: ${toolCalls.length} tool call(s) — ${toolCalls.map((tc) => tc.function.name).join(', ')}`)

    messages.push({
      role: 'assistant',
      tool_calls: toolCalls,
    })

    for (const toolCall of toolCalls) {
      try {
        const result = await executeTool(toolCall, toolSignals)
        messages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: JSON.stringify(result),
        })
      } catch (err) {
        console.error(`[classifier] Tool ${toolCall.function.name} failed:`, err)
        messages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: JSON.stringify({ error: `Tool failed: ${err instanceof Error ? err.message : 'Unknown error'}` }),
        })
      }
    }
  }

  throw new Error(`Classifier exceeded maximum ${MAX_TOOL_ROUNDS} tool rounds without reaching a decision`)
}

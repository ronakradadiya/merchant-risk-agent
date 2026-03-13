import { z } from 'zod'

export const ToolSignalsSchema = z.object({
  domainAgeDays: z.number().optional(),
  hasSSL: z.boolean().optional(),
  googleIndexedPages: z.number().optional(),
  publicComplaints: z.number().optional(),
  upiTyposquatMatch: z.boolean().optional(),
  typosquatConfidence: z.number().min(0).max(1).optional(),
  linkedScamVPAs: z.number().optional(),
  webSearchSummary: z.string().optional(),
})

export const RiskDecisionSchema = z.object({
  id: z.string().uuid(),
  merchantInput: z.any(),
  riskScore: z.number().min(0).max(100),
  riskLevel: z.enum(['low', 'medium', 'high']),
  recommendedAction: z.enum(['approve', 'review', 'reject']),
  policiesTriggered: z.array(z.string()),
  policiesPassed: z.array(z.string()),
  toolSignals: ToolSignalsSchema,
  reasoning: z.string(),
  reviewedAt: z.string().datetime(),
  reviewDurationMs: z.number(),
})

export type RiskDecision = z.infer<typeof RiskDecisionSchema>
export type ToolSignals = z.infer<typeof ToolSignalsSchema>

import { z } from 'zod'

export const ToolSignalsSchema = z.object({
  // Tool 1 — Domain age (P4)
  domainAgeDays: z.number().optional(),
  hasSSL: z.boolean().optional(),
  googleIndexedPages: z.number().optional(),

  // Tool 2 — Web search (P1, P3)
  publicComplaints: z.number().optional(),
  webSearchSummary: z.string().optional(),

  // Tool 3 — UPI pattern check (P2)
  upiTyposquatMatch: z.boolean().optional(),
  typosquatConfidence: z.number().min(0).max(1).optional(),
  linkedScamVPAs: z.number().optional(),

  // Tool 4 — India compliance check (P5, P6)
  phoneStateMatch: z.boolean().optional(),
  ipLocationMatch: z.boolean().optional(),
  serverLocationIndia: z.boolean().optional(),
  gstFormatValid: z.boolean().optional(),
  gstStateMatch: z.boolean().optional(),
  gstActiveStatus: z.boolean().optional(),
})

export const RiskDecisionSchema = z.object({
  id: z.string().uuid(),
  merchantInput: z.any(),
  riskScore: z.number().min(0).max(100),
  riskLevel: z.enum(['low', 'medium', 'high']),
  recommendedAction: z.enum(['approve', 'review', 'reject']),
  confidenceScore: z.number().min(0).max(100),
  confidenceReason: z.string(),
  policiesTriggered: z.array(z.string()),
  policiesPassed: z.array(z.string()),
  toolSignals: ToolSignalsSchema,
  reasoning: z.string(),
  reviewedAt: z.string().datetime(),
  reviewDurationMs: z.number(),
})

export type RiskDecision = z.infer<typeof RiskDecisionSchema>
export type ToolSignals = z.infer<typeof ToolSignalsSchema>

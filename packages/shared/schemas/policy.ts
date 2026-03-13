import { z } from 'zod'

export const PolicySchema = z.object({
  id: z.string(),
  name: z.string(),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  rule: z.string(),
})

export type Policy = z.infer<typeof PolicySchema>

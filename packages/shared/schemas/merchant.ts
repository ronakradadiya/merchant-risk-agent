import { z } from 'zod'

export const MerchantInputSchema = z.object({
  merchantName: z.string().min(2).max(100),
  upiId: z.string().regex(/^[\w.\-]+@[a-z]+$/, 'Invalid UPI ID'),
  businessType: z.string().min(2),
  accountAgeDays: z.number().int().nonnegative(),
  avgTransactionINR: z.number().positive(),
  websiteUrl: z.string().url().optional(),
  location: z.string().min(2),
  transactionVolume30d: z.number().int().nonnegative(),
  phoneNumber: z.string().optional(),
  gstNumber: z.string().optional(),
})

export type MerchantInput = z.infer<typeof MerchantInputSchema>

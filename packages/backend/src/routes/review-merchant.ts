import { Router } from 'express'
import { MerchantInputSchema } from '@merchant-risk-agent/shared'
import { classifyMerchant } from '../agents/classifier'
import { saveReview } from '../store'

export const reviewMerchantRouter = Router()

reviewMerchantRouter.post('/review-merchant', async (req, res) => {
  const parsed = MerchantInputSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({
      error: 'Validation failed',
      details: parsed.error.flatten(),
    })
    return
  }

  try {
    const decision = await classifyMerchant(parsed.data)
    await saveReview(decision)
    res.json(decision)
  } catch (err) {
    console.error('Classification failed:', err)
    res.status(500).json({
      error: 'Classification failed',
      message: err instanceof Error ? err.message : 'Unknown error',
    })
  }
})

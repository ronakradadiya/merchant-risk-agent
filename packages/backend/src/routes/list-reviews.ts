import { Router } from 'express'
import { listReviews } from '../store'

export const listReviewsRouter = Router()

listReviewsRouter.get('/reviews', async (_req, res) => {
  try {
    const reviews = await listReviews()
    res.json(reviews)
  } catch (err) {
    console.error('List reviews failed:', err)
    res.status(500).json({ error: 'Failed to list reviews' })
  }
})

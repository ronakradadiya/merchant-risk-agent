import { Router } from 'express'
import { listReviews } from '../store'

export const listReviewsRouter = Router()

listReviewsRouter.get('/reviews', async (_req, res) => {
  const reviews = await listReviews()
  res.json(reviews)
})

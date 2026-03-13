import { Router } from 'express'
import { listReviews } from '../store'

export const listReviewsRouter = Router()

listReviewsRouter.get('/reviews', (_req, res) => {
  const reviews = listReviews()
  res.json(reviews)
})

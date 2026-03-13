import { Router } from 'express'
import { getReview } from '../store'

export const getReviewRouter = Router()

getReviewRouter.get('/review/:id', (req, res) => {
  const review = getReview(req.params.id)
  if (!review) {
    res.status(404).json({ error: 'Review not found' })
    return
  }
  res.json(review)
})

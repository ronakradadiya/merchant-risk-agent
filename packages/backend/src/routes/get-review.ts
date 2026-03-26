import { Router } from 'express'
import { getReview } from '../store'

export const getReviewRouter = Router()

getReviewRouter.get('/review/:id', async (req, res) => {
  const review = await getReview(req.params.id)
  if (!review) {
    res.status(404).json({ error: 'Review not found' })
    return
  }
  res.json(review)
})

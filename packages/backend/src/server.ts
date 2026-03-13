import express from 'express'
import cors from 'cors'
import { reviewMerchantRouter } from './routes/review-merchant'
import { getReviewRouter } from './routes/get-review'
import { listReviewsRouter } from './routes/list-reviews'

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

app.use(reviewMerchantRouter)
app.use(getReviewRouter)
app.use(listReviewsRouter)

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`)
})

export default app

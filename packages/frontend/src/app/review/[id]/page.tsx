'use client'

import { useParams } from 'next/navigation'
import { useGetReview } from '@/lib/api'
import { RiskDecisionCard } from '@/components/RiskDecisionCard'

export default function ReviewPage() {
  const params = useParams()
  const id = params.id as string
  const { data: decision, isLoading, error } = useGetReview(id)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-gray-500">Loading review...</div>
      </div>
    )
  }

  if (error || !decision) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg">
        Review not found.
      </div>
    )
  }

  return <RiskDecisionCard decision={decision} />
}

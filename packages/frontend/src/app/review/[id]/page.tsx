'use client'

import { useParams } from 'next/navigation'
import { useGetReview } from '@/lib/api'
import { RiskDecisionCard } from '@/components/RiskDecisionCard'
import { Loader2 } from 'lucide-react'

export default function ReviewPage() {
  const params = useParams()
  const id = params.id as string
  const { data: decision, isLoading, error } = useGetReview(id)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading review...
      </div>
    )
  }

  if (error || !decision) {
    return (
      <div className="bg-destructive/10 text-destructive px-6 py-4 rounded-md">
        Review not found.
      </div>
    )
  }

  return <RiskDecisionCard decision={decision} />
}

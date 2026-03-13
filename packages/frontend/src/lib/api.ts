import { useMutation, useQuery } from '@tanstack/react-query'
import type { MerchantInput, RiskDecision } from '@merchant-risk-agent/shared'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(error.error || 'Request failed')
  }
  return res.json()
}

export function useReviewMerchant() {
  return useMutation({
    mutationFn: (input: MerchantInput) =>
      fetchJson<RiskDecision>('/review-merchant', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
  })
}

export function useGetReview(id: string) {
  return useQuery({
    queryKey: ['review', id],
    queryFn: () => fetchJson<RiskDecision>(`/review/${id}`),
    enabled: !!id,
  })
}

export function useListReviews() {
  return useQuery({
    queryKey: ['reviews'],
    queryFn: () => fetchJson<RiskDecision[]>('/reviews'),
  })
}

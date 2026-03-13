'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MerchantInputSchema } from '@merchant-risk-agent/shared'
import type { MerchantInput } from '@merchant-risk-agent/shared'
import { useReviewMerchant } from '@/lib/api'

const initialForm = {
  merchantName: '',
  upiId: '',
  businessType: '',
  accountAgeDays: '',
  avgTransactionINR: '',
  websiteUrl: '',
  location: '',
  transactionVolume30d: '',
  phoneNumber: '',
  gstNumber: '',
}

export function MerchantForm() {
  const router = useRouter()
  const reviewMutation = useReviewMerchant()
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState<Record<string, string>>({})

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: '' }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrors({})

    const input: Record<string, unknown> = {
      merchantName: form.merchantName,
      upiId: form.upiId,
      businessType: form.businessType,
      accountAgeDays: Number(form.accountAgeDays),
      avgTransactionINR: Number(form.avgTransactionINR),
      location: form.location,
      transactionVolume30d: Number(form.transactionVolume30d),
    }
    if (form.websiteUrl) input.websiteUrl = form.websiteUrl
    if (form.phoneNumber) input.phoneNumber = form.phoneNumber
    if (form.gstNumber) input.gstNumber = form.gstNumber

    const parsed = MerchantInputSchema.safeParse(input)
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {}
      for (const issue of parsed.error.issues) {
        const field = issue.path[0]?.toString()
        if (field) fieldErrors[field] = issue.message
      }
      setErrors(fieldErrors)
      return
    }

    try {
      const decision = await reviewMutation.mutateAsync(parsed.data as MerchantInput)
      router.push(`/review/${decision.id}`)
    } catch {
      setErrors({ _form: 'Failed to submit review. Is the backend running?' })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errors._form && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {errors._form}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Field label="Merchant Name" required error={errors.merchantName}>
          <input
            type="text"
            value={form.merchantName}
            onChange={(e) => update('merchantName', e.target.value)}
            placeholder="ShopEasy Electronics"
            className="input"
          />
        </Field>

        <Field label="UPI ID" required error={errors.upiId}>
          <input
            type="text"
            value={form.upiId}
            onChange={(e) => update('upiId', e.target.value)}
            placeholder="merchant@ybl"
            className="input"
          />
        </Field>

        <Field label="Business Type" required error={errors.businessType}>
          <input
            type="text"
            value={form.businessType}
            onChange={(e) => update('businessType', e.target.value)}
            placeholder="Electronics, Grocery, Fashion..."
            className="input"
          />
        </Field>

        <Field label="Account Age (days)" required error={errors.accountAgeDays}>
          <input
            type="number"
            value={form.accountAgeDays}
            onChange={(e) => update('accountAgeDays', e.target.value)}
            placeholder="15"
            className="input"
          />
        </Field>

        <Field label="Avg Transaction (INR)" required error={errors.avgTransactionINR}>
          <input
            type="number"
            value={form.avgTransactionINR}
            onChange={(e) => update('avgTransactionINR', e.target.value)}
            placeholder="15000"
            className="input"
          />
        </Field>

        <Field label="Transaction Volume (30d)" required error={errors.transactionVolume30d}>
          <input
            type="number"
            value={form.transactionVolume30d}
            onChange={(e) => update('transactionVolume30d', e.target.value)}
            placeholder="750"
            className="input"
          />
        </Field>

        <Field label="Location" required error={errors.location}>
          <input
            type="text"
            value={form.location}
            onChange={(e) => update('location', e.target.value)}
            placeholder="Mumbai, Maharashtra"
            className="input"
          />
        </Field>

        <Field label="Website URL" error={errors.websiteUrl}>
          <input
            type="text"
            value={form.websiteUrl}
            onChange={(e) => update('websiteUrl', e.target.value)}
            placeholder="https://shopeasyelec.in"
            className="input"
          />
        </Field>

        <Field label="Phone Number" error={errors.phoneNumber}>
          <input
            type="text"
            value={form.phoneNumber}
            onChange={(e) => update('phoneNumber', e.target.value)}
            placeholder="+91 98765 43210"
            className="input"
          />
        </Field>

        <Field label="GST Number" error={errors.gstNumber}>
          <input
            type="text"
            value={form.gstNumber}
            onChange={(e) => update('gstNumber', e.target.value)}
            placeholder="22AAAAA0000A1Z5"
            className="input"
          />
        </Field>
      </div>

      <button
        type="submit"
        disabled={reviewMutation.isPending}
        className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {reviewMutation.isPending ? 'Agent is analyzing...' : 'Submit for Risk Review'}
      </button>
    </form>
  )
}

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string
  required?: boolean
  error?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  )
}

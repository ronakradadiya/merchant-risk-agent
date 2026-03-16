'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MerchantInputSchema } from '@merchant-risk-agent/shared'
import type { MerchantInput } from '@merchant-risk-agent/shared'
import { useReviewMerchant } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

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
    <Card>
      <CardHeader>
        <CardTitle>New Merchant Review</CardTitle>
        <CardDescription>
          Submit a merchant profile for AI-powered fraud risk assessment.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {errors._form && (
            <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md text-sm">
              {errors._form}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label="Merchant Name" error={errors.merchantName} required>
              <Input
                value={form.merchantName}
                onChange={(e) => update('merchantName', e.target.value)}
                placeholder="ShopEasy Electronics"
              />
            </Field>

            <Field label="UPI ID" error={errors.upiId} required>
              <Input
                value={form.upiId}
                onChange={(e) => update('upiId', e.target.value)}
                placeholder="merchant@ybl"
              />
            </Field>

            <Field label="Business Type" error={errors.businessType} required>
              <Input
                value={form.businessType}
                onChange={(e) => update('businessType', e.target.value)}
                placeholder="Electronics, Grocery, Fashion..."
              />
            </Field>

            <Field label="Account Age (days)" error={errors.accountAgeDays} required>
              <Input
                type="number"
                value={form.accountAgeDays}
                onChange={(e) => update('accountAgeDays', e.target.value)}
                placeholder="15"
              />
            </Field>

            <Field label="Avg Transaction (INR)" error={errors.avgTransactionINR} required>
              <Input
                type="number"
                value={form.avgTransactionINR}
                onChange={(e) => update('avgTransactionINR', e.target.value)}
                placeholder="15000"
              />
            </Field>

            <Field label="Transaction Volume (30d)" error={errors.transactionVolume30d} required>
              <Input
                type="number"
                value={form.transactionVolume30d}
                onChange={(e) => update('transactionVolume30d', e.target.value)}
                placeholder="750"
              />
            </Field>

            <Field label="Location" error={errors.location} required>
              <Input
                value={form.location}
                onChange={(e) => update('location', e.target.value)}
                placeholder="Mumbai, Maharashtra"
              />
            </Field>

            <Field label="Website URL" error={errors.websiteUrl}>
              <Input
                value={form.websiteUrl}
                onChange={(e) => update('websiteUrl', e.target.value)}
                placeholder="https://shopeasyelec.in"
              />
            </Field>

            <Field label="Phone Number" error={errors.phoneNumber} hint="Used for P5 location checks">
              <Input
                value={form.phoneNumber}
                onChange={(e) => update('phoneNumber', e.target.value)}
                placeholder="+91 98765 43210"
              />
            </Field>

            <Field label="GST Number" error={errors.gstNumber} hint="Used for P6 compliance checks">
              <Input
                value={form.gstNumber}
                onChange={(e) => update('gstNumber', e.target.value)}
                placeholder="27AAPFU0939F1ZV"
              />
            </Field>
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={reviewMutation.isPending}>
            {reviewMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Agent is analyzing...
              </>
            ) : (
              'Submit for Risk Review'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

function Field({
  label,
  required,
  error,
  hint,
  children,
}: {
  label: string
  required?: boolean
  error?: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <Label>
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

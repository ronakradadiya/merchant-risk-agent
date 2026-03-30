'use client'

import { useAnalytics } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import { Activity, CheckCircle2, Clock, ShieldAlert, ShieldCheck, ShieldX, TrendingUp } from 'lucide-react'

export default function AnalyticsPage() {
  const { data, isLoading, error } = useAnalytics()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center space-y-2">
          <Activity className="h-8 w-8 text-primary animate-pulse mx-auto" />
          <p className="text-sm text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="py-24 text-center text-muted-foreground text-sm">
        Failed to load analytics data.
      </div>
    )
  }

  const total = data.last30Days || 1
  const barData = data.policyFrequency.map((p) => ({
    name: p.policyId,
    fullName: p.policyName,
    count: p.count,
    percentage: p.percentage,
  }))

  const barColors = ['#ef4444', '#ef4444', '#f97316', '#f97316', '#eab308']

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Policy Analytics</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Last 30 days · {data.last30Days} reviews</p>
        </div>
        <Link href="/history" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          View history →
        </Link>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-5 pb-5">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mb-1">Total Reviews</p>
            <p className="text-3xl font-black">{data.totalReviews}</p>
            <p className="text-xs text-muted-foreground mt-1">{data.last30Days} last 30 days</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-5">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mb-1">Avg Risk Score</p>
            <p className={`text-3xl font-black ${data.avgRiskScore >= 70 ? 'text-red-600' : data.avgRiskScore >= 40 ? 'text-amber-600' : 'text-emerald-600'}`}>
              {data.avgRiskScore}
            </p>
            <p className="text-xs text-muted-foreground mt-1">out of 100</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-5">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mb-1">Avg Confidence</p>
            <p className={`text-3xl font-black ${data.avgConfidence >= 80 ? 'text-emerald-600' : data.avgConfidence >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
              {data.avgConfidence}%
            </p>
            <p className="text-xs text-muted-foreground mt-1">signal quality</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-5">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mb-2">Verdict Split</p>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <ShieldX className="h-3.5 w-3.5 text-red-500 shrink-0" />
                <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-red-500 rounded-full" style={{ width: `${Math.round((data.verdictBreakdown.reject / total) * 100)}%` }} />
                </div>
                <span className="text-xs font-semibold w-8 text-right">{data.verdictBreakdown.reject}</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: `${Math.round((data.verdictBreakdown.review / total) * 100)}%` }} />
                </div>
                <span className="text-xs font-semibold w-8 text-right">{data.verdictBreakdown.review}</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.round((data.verdictBreakdown.approve / total) * 100)}%` }} />
                </div>
                <span className="text-xs font-semibold w-8 text-right">{data.verdictBreakdown.approve}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bar chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
            Policy Trigger Frequency
          </CardTitle>
          <p className="text-xs text-muted-foreground">How often each policy was triggered in the last 30 days</p>
        </CardHeader>
        <CardContent>
          {barData.every((d) => d.count === 0) ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No policy triggers in the last 30 days. Seed some reviews to see data here.
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={barData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }} barCategoryGap="35%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fontWeight: 600 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null
                      const d = payload[0].payload
                      return (
                        <div className="bg-white border rounded-lg shadow-lg px-3 py-2 text-xs">
                          <p className="font-semibold text-sm">{d.name}</p>
                          <p className="text-muted-foreground">{d.fullName}</p>
                          <p className="mt-1"><span className="font-bold text-foreground">{d.count}</span> triggers ({d.percentage}%)</p>
                        </div>
                      )
                    }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {barData.map((_, i) => (
                      <Cell key={i} fill={barColors[i] ?? '#94a3b8'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>

              {/* Policy legend */}
              <div className="mt-4 space-y-2">
                {data.policyFrequency.map((p, i) => (
                  <div key={p.policyId} className="flex items-center gap-3">
                    <Badge className="text-[10px] font-bold w-8 justify-center shrink-0"
                      style={{ backgroundColor: barColors[i] ?? '#94a3b8', border: 'none', color: 'white' }}>
                      {p.policyId}
                    </Badge>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs text-muted-foreground">{p.policyName}</span>
                        <span className="text-xs font-semibold">{p.percentage}%</span>
                      </div>
                      <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all"
                          style={{ width: `${p.percentage}%`, backgroundColor: barColors[i] ?? '#94a3b8' }} />
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground w-12 text-right">{p.count} / {data.last30Days}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

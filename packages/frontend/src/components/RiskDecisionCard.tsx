'use client'

import type { RiskDecision } from '@merchant-risk-agent/shared'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import {
  ShieldAlert, ShieldCheck, ShieldX,
  Globe, Search, Fingerprint, MapPin,
  CheckCircle2, XCircle, Clock,
} from 'lucide-react'

const riskLevelVariant = {
  low: 'default' as const,
  medium: 'secondary' as const,
  high: 'destructive' as const,
}

const actionConfig = {
  approve: { label: 'APPROVE', icon: ShieldCheck, className: 'bg-green-600 hover:bg-green-700' },
  review: { label: 'REVIEW', icon: ShieldAlert, className: 'bg-yellow-500 hover:bg-yellow-600' },
  reject: { label: 'REJECT', icon: ShieldX, className: 'bg-red-600 hover:bg-red-700' },
}

function scoreColor(score: number): string {
  if (score >= 70) return 'hsl(0, 72%, 51%)'
  if (score >= 40) return 'hsl(38, 92%, 50%)'
  return 'hsl(142, 71%, 45%)'
}

function progressColor(score: number): string {
  if (score >= 70) return '[&>div]:bg-red-500'
  if (score >= 40) return '[&>div]:bg-yellow-500'
  return '[&>div]:bg-green-500'
}

export function RiskDecisionCard({ decision }: { decision: RiskDecision }) {
  const action = actionConfig[decision.recommendedAction]
  const ActionIcon = action.icon

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Risk Assessment</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {decision.merchantInput?.merchantName} &mdash; {decision.merchantInput?.upiId}
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          Analyzed in {(decision.reviewDurationMs / 1000).toFixed(1)}s
        </div>
      </div>

      {/* Score + Level + Action */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Risk Score</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold mb-2" style={{ color: scoreColor(decision.riskScore) }}>
              {decision.riskScore}<span className="text-lg text-muted-foreground font-normal">/100</span>
            </div>
            <Progress value={decision.riskScore} className={`h-2 ${progressColor(decision.riskScore)}`} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Risk Level</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center">
            <Badge variant={riskLevelVariant[decision.riskLevel]} className="text-base px-4 py-1 uppercase">
              {decision.riskLevel}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Recommended Action</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center">
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-md text-white font-semibold text-sm ${action.className}`}>
              <ActionIcon className="h-4 w-4" />
              {action.label}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Policies */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2 text-red-600">
              <XCircle className="h-4 w-4" /> Policies Triggered
            </CardTitle>
          </CardHeader>
          <CardContent>
            {decision.policiesTriggered.length === 0 ? (
              <p className="text-sm text-muted-foreground">None</p>
            ) : (
              <ul className="space-y-2">
                {decision.policiesTriggered.map((p, i) => {
                  const severity = getSeverity(p)
                  return (
                    <li key={i} className="text-sm flex items-start gap-2">
                      <Badge variant="destructive" className="text-[10px] px-1.5 py-0 shrink-0 mt-0.5">
                        {severity}
                      </Badge>
                      <span>{p}</span>
                    </li>
                  )
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-4 w-4" /> Policies Passed
            </CardTitle>
          </CardHeader>
          <CardContent>
            {decision.policiesPassed.length === 0 ? (
              <p className="text-sm text-muted-foreground">None</p>
            ) : (
              <ul className="space-y-2">
                {decision.policiesPassed.map((p, i) => (
                  <li key={i} className="text-sm flex items-start gap-2">
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0 mt-0.5 text-green-600 border-green-300">
                      PASS
                    </Badge>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tool Signals — grouped by tool */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Tool Investigation Signals</CardTitle>
          <CardDescription>Data gathered autonomously by the agent&apos;s 4 tools</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ToolGroup icon={Globe} title="Domain Check (P4)" signals={[
            signal('Domain Age', decision.toolSignals.domainAgeDays, (v) => `${v} days`),
            signal('SSL Certificate', decision.toolSignals.hasSSL, (v) => v ? 'Yes' : 'No'),
            signal('Google Indexed', decision.toolSignals.googleIndexedPages, (v) => `${v} pages`),
          ]} />

          <Separator />

          <ToolGroup icon={Search} title="Web Search (P1/P3)" signals={[
            signal('Public Complaints', decision.toolSignals.publicComplaints, String),
            signal('Search Summary', decision.toolSignals.webSearchSummary, (v) => v.length > 120 ? v.substring(0, 120) + '...' : v),
          ]} />

          <Separator />

          <ToolGroup icon={Fingerprint} title="UPI Pattern (P2)" signals={[
            signal('Typosquat Match', decision.toolSignals.upiTyposquatMatch, (v) => v ? 'Yes' : 'No'),
            signal('Confidence', decision.toolSignals.typosquatConfidence, (v) => `${Math.round(v * 100)}%`),
          ]} />

          <Separator />

          <ToolGroup icon={MapPin} title="India Compliance (P5/P6)" signals={[
            signal('Phone State Match', decision.toolSignals.phoneStateMatch, (v) => v ? 'Match' : 'Mismatch'),
            signal('IP Location Match', decision.toolSignals.ipLocationMatch, (v) => v ? 'Match' : 'Mismatch'),
            signal('Server in India', decision.toolSignals.serverLocationIndia, (v) => v ? 'Yes' : 'No'),
            signal('GST Format Valid', decision.toolSignals.gstFormatValid, (v) => v ? 'Valid' : 'Invalid'),
            signal('GST State Match', decision.toolSignals.gstStateMatch, (v) => v ? 'Match' : 'Mismatch'),
            signal('GST Active', decision.toolSignals.gstActiveStatus, (v) => v ? 'Active' : 'Inactive'),
          ]} />
        </CardContent>
      </Card>

      {/* Reasoning */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">AI Reasoning</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground leading-relaxed">{decision.reasoning}</p>
        </CardContent>
      </Card>

      <Link href="/">
        <Button>Review another merchant</Button>
      </Link>
    </div>
  )
}

// --- Helpers ---

function getSeverity(policyStr: string): string {
  const id = policyStr.match(/^P(\d)/)?.[1]
  if (!id) return 'FAIL'
  const num = parseInt(id)
  if (num <= 2) return 'CRITICAL'
  if (num <= 4) return 'HIGH'
  return 'MEDIUM'
}

function signal<T>(label: string, value: T | undefined | null, format: (v: NonNullable<T>) => string): { label: string; value: string } | null {
  if (value == null) return null
  return { label, value: format(value as NonNullable<T>) }
}

function ToolGroup({
  icon: Icon,
  title,
  signals,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  signals: ({ label: string; value: string } | null)[]
}) {
  const active = signals.filter(Boolean) as { label: string; value: string }[]
  if (active.length === 0) {
    return (
      <div>
        <div className="flex items-center gap-2 text-sm font-medium mb-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          {title}
        </div>
        <p className="text-xs text-muted-foreground ml-6">Not called</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center gap-2 text-sm font-medium mb-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        {title}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 ml-6">
        {active.map((s) => (
          <div key={s.label}>
            <div className="text-xs text-muted-foreground">{s.label}</div>
            <div className="text-sm font-medium">{s.value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

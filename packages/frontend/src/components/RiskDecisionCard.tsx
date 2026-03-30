'use client'

import type { RiskDecision } from '@merchant-risk-agent/shared'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ConfidenceScore } from '@/components/ConfidenceScore'
import Link from 'next/link'
import {
  ShieldAlert, ShieldCheck, ShieldX,
  Globe, Search, Fingerprint, MapPin,
  CheckCircle2, XCircle, Clock, ArrowLeft,
  Activity, TrendingUp,
} from 'lucide-react'

const actionConfig = {
  approve: { label: 'APPROVE', icon: ShieldCheck, gradient: 'from-emerald-500 to-emerald-600', bg: 'bg-emerald-500', text: 'text-emerald-700', light: 'bg-emerald-50', border: 'border-emerald-200', ring: 'ring-emerald-500/20' },
  review: { label: 'REVIEW', icon: ShieldAlert, gradient: 'from-amber-500 to-amber-600', bg: 'bg-amber-500', text: 'text-amber-700', light: 'bg-amber-50', border: 'border-amber-200', ring: 'ring-amber-500/20' },
  reject: { label: 'REJECT', icon: ShieldX, gradient: 'from-red-500 to-red-600', bg: 'bg-red-500', text: 'text-red-700', light: 'bg-red-50', border: 'border-red-200', ring: 'ring-red-500/20' },
}

function scoreGradient(score: number) {
  if (score >= 70) return { stroke: '#ef4444', bg: 'text-red-600', glow: 'drop-shadow(0 0 6px rgba(239,68,68,0.4))' }
  if (score >= 40) return { stroke: '#f59e0b', bg: 'text-amber-600', glow: 'drop-shadow(0 0 6px rgba(245,158,11,0.4))' }
  return { stroke: '#10b981', bg: 'text-emerald-600', glow: 'drop-shadow(0 0 6px rgba(16,185,129,0.4))' }
}

export function RiskDecisionCard({ decision }: { decision: RiskDecision }) {
  const action = actionConfig[decision.recommendedAction]
  const ActionIcon = action.icon
  const sg = scoreGradient(decision.riskScore)

  return (
    <div className="space-y-5">
      {/* Back */}
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Back to reviews
      </Link>

      {/* Verdict Card */}
      <Card className="overflow-hidden">
        <div className="p-5 pb-4">
          {/* Merchant info + time */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold tracking-tight">{decision.merchantInput?.merchantName}</h1>
              <p className="text-xs text-muted-foreground font-mono mt-0.5">{decision.merchantInput?.upiId}</p>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Clock className="h-3 w-3" />
              {(decision.reviewDurationMs / 1000).toFixed(1)}s
            </div>
          </div>

          {/* Score spectrum bar */}
          <div className="mb-4">
            <div className="relative h-3 rounded-full bg-gradient-to-r from-emerald-400 via-amber-400 to-red-500 overflow-visible">
              {/* Score marker */}
              <div
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 transition-all"
                style={{ left: `${decision.riskScore}%` }}
              >
                <div className="w-5 h-5 rounded-full bg-white border-[3px] shadow-md"
                  style={{ borderColor: sg.stroke }}
                />
              </div>
            </div>
            <div className="flex justify-between mt-1.5 text-[10px] text-muted-foreground font-medium">
              <span>0 — Safe</span>
              <span>50 — Risky</span>
              <span>100 — Fraud</span>
            </div>
          </div>

          {/* Verdict row */}
          <div className="flex items-center gap-3">
            <span className={`text-4xl font-black tabular-nums ${sg.bg}`}>{decision.riskScore}</span>
            <div className="flex-1">
              <p className="text-sm font-semibold">
                {decision.riskScore >= 70 ? 'High risk — likely fraudulent'
                  : decision.riskScore >= 40 ? 'Medium risk — needs investigation'
                  : 'Low risk — appears legitimate'}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {decision.policiesTriggered.length} of {decision.policiesTriggered.length + decision.policiesPassed.length} policies triggered
              </p>
            </div>
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm uppercase tracking-wider text-white ${action.bg} shadow-sm`}>
              <ActionIcon className="h-4 w-4" />
              {action.label}
            </div>
          </div>
        </div>
      </Card>

      {/* Confidence */}
      {decision.confidenceScore != null && decision.confidenceReason && (
        <ConfidenceScore score={decision.confidenceScore} reason={decision.confidenceReason} />
      )}

      {/* Policies */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Triggered */}
        <Card className={`${decision.policiesTriggered.length > 0 ? 'border-red-200 bg-red-50/30' : ''}`}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-red-100 flex items-center justify-center">
                <XCircle className="h-4 w-4 text-red-600" />
              </div>
              <span className="text-red-700 font-semibold">Policies Triggered</span>
              {decision.policiesTriggered.length > 0 && (
                <Badge variant="destructive" className="ml-auto text-[10px] h-5 min-w-[20px] justify-center">
                  {decision.policiesTriggered.length}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {decision.policiesTriggered.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No policies triggered</p>
            ) : (
              <ul className="space-y-2.5">
                {decision.policiesTriggered.map((p, i) => {
                  const severity = getSeverity(p)
                  const sevConfig = severityConfig[severity]
                  return (
                    <li key={i} className="text-sm flex items-start gap-2.5 bg-white rounded-lg px-3 py-2.5 shadow-sm border border-red-100">
                      <Badge className={`text-[10px] px-1.5 py-0 shrink-0 mt-0.5 font-bold ${sevConfig.className}`}>
                        {severity}
                      </Badge>
                      <span className="leading-relaxed text-slate-700">{p}</span>
                    </li>
                  )
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Passed */}
        <Card className={`${decision.policiesTriggered.length === 0 ? 'border-emerald-200 bg-emerald-50/30' : ''}`}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-emerald-100 flex items-center justify-center">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              </div>
              <span className="text-emerald-700 font-semibold">Policies Passed</span>
              {decision.policiesPassed.length > 0 && (
                <span className="ml-auto text-xs font-medium text-emerald-600 bg-emerald-100 h-5 min-w-[20px] flex items-center justify-center rounded-full px-1.5">
                  {decision.policiesPassed.length}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {decision.policiesPassed.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No policies evaluated</p>
            ) : (
              <ul className="space-y-2">
                {decision.policiesPassed.map((p, i) => (
                  <li key={i} className="text-sm flex items-start gap-2.5 px-3 py-2 rounded-lg hover:bg-emerald-50/50 transition-colors">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">{p}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tool Signals */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <Activity className="h-4 w-4 text-primary" />
            </div>
            Tool Investigation Signals
          </CardTitle>
          <p className="text-xs text-muted-foreground">Evidence gathered autonomously by 4 investigative tools</p>
        </CardHeader>
        <CardContent className="space-y-1">
          <ToolGroup icon={Globe} title="Domain Check" tag="P4" color="blue" signals={[
            signal('Domain Age', decision.toolSignals.domainAgeDays, (v) => `${v} days`, v => typeof v === 'number' && v < 60),
            signal('SSL Certificate', decision.toolSignals.hasSSL, (v) => v ? 'Yes' : 'No', v => v === false),
            signal('Google Indexed', decision.toolSignals.googleIndexedPages, (v) => `${v} pages`, v => v === 0),
          ]} />

          <ToolGroup icon={Search} title="Web Search" tag="P1/P3" color="purple" signals={[
            signal('Fraud Complaints', decision.toolSignals.publicComplaints, String, v => typeof v === 'number' && v > 0),
            signal('Summary', decision.toolSignals.webSearchSummary, (v) => v.length > 150 ? v.substring(0, 150) + '...' : v),
          ]} />

          <ToolGroup icon={Fingerprint} title="UPI Pattern" tag="P2" color="orange" signals={[
            signal('Typosquat Match', decision.toolSignals.upiTyposquatMatch, (v) => v ? 'Yes' : 'No', v => v === true),
            signal('Confidence', decision.toolSignals.typosquatConfidence, (v) => `${Math.round(v * 100)}%`, v => typeof v === 'number' && v > 0.5),
          ]} />

          <ToolGroup icon={MapPin} title="GST Compliance" tag="P5" color="teal" signals={[
            signal('GST Format', decision.toolSignals.gstFormatValid, (v) => v ? 'Valid' : 'Invalid', v => v === false),
            signal('GST State', decision.toolSignals.gstStateMatch, (v) => v ? 'Match' : 'Mismatch', v => v === false),
            signal('GST Active', decision.toolSignals.gstActiveStatus, (v) => v ? 'Active' : 'Inactive', v => v === false),
          ]} />
        </CardContent>
      </Card>

      {/* AI Reasoning */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/[0.03] to-transparent">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
            AI Reasoning
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed text-slate-600">{decision.reasoning}</p>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3 pb-4">
        <Link href="/">
          <Button size="lg">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Review another merchant
          </Button>
        </Link>
        <Link href="/history">
          <Button variant="outline" size="lg">
            View history
          </Button>
        </Link>
      </div>
    </div>
  )
}

// --- Helpers ---

const severityConfig: Record<string, { className: string }> = {
  CRITICAL: { className: 'bg-red-600 text-white border-transparent hover:bg-red-600' },
  HIGH: { className: 'bg-orange-500 text-white border-transparent hover:bg-orange-500' },
  MEDIUM: { className: 'bg-amber-400 text-amber-900 border-transparent hover:bg-amber-400' },
  FAIL: { className: 'bg-red-600 text-white border-transparent hover:bg-red-600' },
}

function getSeverity(policyStr: string): string {
  const id = policyStr.match(/^P(\d)/)?.[1]
  if (!id) return 'FAIL'
  const num = parseInt(id)
  if (num <= 2) return 'CRITICAL'
  if (num <= 4) return 'HIGH'
  return 'MEDIUM'
}

type SignalEntry = { label: string; value: string; isAlert?: boolean } | null

function signal<T>(
  label: string,
  value: T | undefined | null,
  format: (v: NonNullable<T>) => string,
  isAlertFn?: (v: NonNullable<T>) => boolean,
): SignalEntry {
  if (value == null) return null
  return {
    label,
    value: format(value as NonNullable<T>),
    isAlert: isAlertFn ? isAlertFn(value as NonNullable<T>) : false,
  }
}

const tagColors: Record<string, { bg: string; icon: string }> = {
  blue: { bg: 'bg-blue-50 border-blue-100', icon: 'text-blue-600' },
  purple: { bg: 'bg-purple-50 border-purple-100', icon: 'text-purple-600' },
  orange: { bg: 'bg-orange-50 border-orange-100', icon: 'text-orange-600' },
  teal: { bg: 'bg-teal-50 border-teal-100', icon: 'text-teal-600' },
}

const tagBadgeColors: Record<string, string> = {
  blue: 'bg-blue-100 text-blue-700',
  purple: 'bg-purple-100 text-purple-700',
  orange: 'bg-orange-100 text-orange-700',
  teal: 'bg-teal-100 text-teal-700',
}

function ToolGroup({
  icon: Icon,
  title,
  tag,
  color,
  signals,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  tag: string
  color: string
  signals: SignalEntry[]
}) {
  const active = signals.filter(Boolean) as { label: string; value: string; isAlert?: boolean }[]
  const tc = tagColors[color]

  return (
    <div className={`rounded-xl border p-4 ${tc.bg}`}>
      <div className="flex items-center gap-2 mb-3">
        <Icon className={`h-4 w-4 ${tc.icon}`} />
        <span className="text-sm font-semibold">{title}</span>
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${tagBadgeColors[color]}`}>{tag}</span>
      </div>
      {active.length === 0 ? (
        <p className="text-xs text-muted-foreground ml-6">Not called</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
          {active.map((s) => (
            <div key={s.label} className="bg-white rounded-lg px-3 py-2.5 shadow-sm border border-white">
              <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mb-1">{s.label}</div>
              <div className={`text-sm font-semibold ${s.isAlert ? 'text-red-600' : 'text-slate-800'}`}>
                {s.value}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

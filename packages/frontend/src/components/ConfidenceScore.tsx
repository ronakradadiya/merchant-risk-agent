'use client'

import { Info } from 'lucide-react'

interface Props {
  score: number
  reason: string
}

export function ConfidenceScore({ score, reason }: Props) {
  const { label, barColor, textColor, bg } =
    score >= 80
      ? { label: 'High confidence', barColor: 'bg-emerald-500', textColor: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' }
      : score >= 50
      ? { label: 'Medium confidence', barColor: 'bg-amber-500', textColor: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' }
      : { label: 'Low confidence', barColor: 'bg-red-500', textColor: 'text-red-700', bg: 'bg-red-50 border-red-200' }

  return (
    <div className={`rounded-xl border px-4 py-3 ${bg}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <Info className={`h-3.5 w-3.5 ${textColor}`} />
          <span className={`text-xs font-semibold uppercase tracking-wider ${textColor}`}>{label}</span>
        </div>
        <span className={`text-lg font-black tabular-nums ${textColor}`}>{score}%</span>
      </div>
      <div className="h-1.5 bg-black/10 rounded-full overflow-hidden mb-2">
        <div className={`h-full ${barColor} rounded-full transition-all`} style={{ width: `${score}%` }} />
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">{reason}</p>
    </div>
  )
}

'use client'

import type { RiskDecision } from '@merchant-risk-agent/shared'

const riskColors = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-red-100 text-red-800',
}

const actionColors = {
  approve: 'bg-green-600',
  review: 'bg-yellow-500',
  reject: 'bg-red-600',
}

export function RiskDecisionCard({ decision }: { decision: RiskDecision }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Risk Assessment</h1>
        <span className="text-sm text-gray-500">
          Analyzed in {(decision.reviewDurationMs / 1000).toFixed(1)}s
        </span>
      </div>

      {/* Score + Level + Action */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
          <div className="text-sm text-gray-500 mb-2">Risk Score</div>
          <div className="text-4xl font-bold" style={{ color: scoreColor(decision.riskScore) }}>
            {decision.riskScore}
          </div>
          <div className="text-sm text-gray-400 mt-1">/ 100</div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
          <div className="text-sm text-gray-500 mb-2">Risk Level</div>
          <span className={`inline-block px-4 py-2 rounded-full text-sm font-semibold uppercase ${riskColors[decision.riskLevel]}`}>
            {decision.riskLevel}
          </span>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
          <div className="text-sm text-gray-500 mb-2">Recommended Action</div>
          <span className={`inline-block px-4 py-2 rounded-full text-sm font-semibold uppercase text-white ${actionColors[decision.recommendedAction]}`}>
            {decision.recommendedAction}
          </span>
        </div>
      </div>

      {/* Policies */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-red-600 mb-3">Policies Triggered</h3>
          {decision.policiesTriggered.length === 0 ? (
            <p className="text-sm text-gray-400">None</p>
          ) : (
            <ul className="space-y-2">
              {decision.policiesTriggered.map((p, i) => (
                <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                  <span className="text-red-500 mt-0.5">&#x2716;</span> {p}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-green-600 mb-3">Policies Passed</h3>
          {decision.policiesPassed.length === 0 ? (
            <p className="text-sm text-gray-400">None</p>
          ) : (
            <ul className="space-y-2">
              {decision.policiesPassed.map((p, i) => (
                <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">&#x2714;</span> {p}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Tool Signals */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Tool Signals</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          {decision.toolSignals.domainAgeDays != null && (
            <Signal label="Domain Age" value={`${decision.toolSignals.domainAgeDays} days`} />
          )}
          {decision.toolSignals.hasSSL != null && (
            <Signal label="SSL" value={decision.toolSignals.hasSSL ? 'Yes' : 'No'} />
          )}
          {decision.toolSignals.googleIndexedPages != null && (
            <Signal label="Google Indexed" value={`${decision.toolSignals.googleIndexedPages} pages`} />
          )}
          {decision.toolSignals.publicComplaints != null && (
            <Signal label="Complaints" value={String(decision.toolSignals.publicComplaints)} />
          )}
          {decision.toolSignals.upiTyposquatMatch != null && (
            <Signal label="Typosquat" value={decision.toolSignals.upiTyposquatMatch ? 'Match' : 'None'} />
          )}
        </div>
      </div>

      {/* Reasoning */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">AI Reasoning</h3>
        <p className="text-sm text-gray-600 leading-relaxed">{decision.reasoning}</p>
      </div>

      <a
        href="/"
        className="inline-block bg-blue-600 text-white py-2 px-6 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
      >
        Review another merchant
      </a>
    </div>
  )
}

function Signal({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-gray-400">{label}</div>
      <div className="font-medium text-gray-900">{value}</div>
    </div>
  )
}

function scoreColor(score: number): string {
  if (score >= 70) return '#dc2626'
  if (score >= 40) return '#d97706'
  return '#16a34a'
}

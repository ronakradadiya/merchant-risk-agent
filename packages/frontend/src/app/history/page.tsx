'use client'

import { useListReviews } from '@/lib/api'
import { useAppStore } from '@/lib/store'

export default function HistoryPage() {
  const { data: reviews, isLoading } = useListReviews()
  const { riskLevelFilter, setRiskLevelFilter } = useAppStore()

  const filtered = reviews?.filter(
    (r) => riskLevelFilter === 'all' || r.riskLevel === riskLevelFilter
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Review History</h1>
        <div className="flex gap-2">
          {(['all', 'low', 'medium', 'high'] as const).map((level) => (
            <button
              key={level}
              onClick={() => setRiskLevelFilter(level)}
              className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                riskLevelFilter === level
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
              }`}
            >
              {level === 'all' ? 'All' : level.charAt(0).toUpperCase() + level.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="text-gray-500 py-10 text-center">Loading...</div>
      ) : !filtered || filtered.length === 0 ? (
        <div className="text-gray-400 py-10 text-center">No reviews yet.</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Merchant</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">UPI ID</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Score</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Action</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((r) => (
                <tr
                  key={r.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => (window.location.href = `/review/${r.id}`)}
                >
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {r.merchantInput?.merchantName || 'Unknown'}
                  </td>
                  <td className="px-4 py-3 text-gray-600 font-mono">
                    {r.merchantInput?.upiId || '-'}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="font-semibold"
                      style={{
                        color: r.riskScore >= 70 ? '#dc2626' : r.riskScore >= 40 ? '#d97706' : '#16a34a',
                      }}
                    >
                      {r.riskScore}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-semibold uppercase text-white ${
                        r.recommendedAction === 'reject'
                          ? 'bg-red-600'
                          : r.recommendedAction === 'review'
                          ? 'bg-yellow-500'
                          : 'bg-green-600'
                      }`}
                    >
                      {r.recommendedAction}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(r.reviewedAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

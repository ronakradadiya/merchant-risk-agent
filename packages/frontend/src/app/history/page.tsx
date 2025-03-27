'use client'

import { useRouter } from 'next/navigation'
import { useListReviews } from '@/lib/api'
import { useAppStore } from '@/lib/store'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Loader2, History, ShieldCheck, ShieldAlert, ShieldX } from 'lucide-react'

const riskLevelVariant = {
  low: 'default' as const,
  medium: 'secondary' as const,
  high: 'destructive' as const,
}

const actionConfig: Record<string, { icon: React.ComponentType<{ className?: string }>; className: string }> = {
  reject: { icon: ShieldX, className: 'bg-red-500 text-white' },
  review: { icon: ShieldAlert, className: 'bg-amber-500 text-white' },
  approve: { icon: ShieldCheck, className: 'bg-emerald-500 text-white' },
}

const filters = ['all', 'low', 'medium', 'high'] as const

export default function HistoryPage() {
  const router = useRouter()
  const { data: reviews, isLoading } = useListReviews()
  const { riskLevelFilter, setRiskLevelFilter } = useAppStore()

  const filtered = reviews?.filter(
    (r) => riskLevelFilter === 'all' || r.riskLevel === riskLevelFilter
  )

  const stats = reviews ? {
    total: reviews.length,
    rejected: reviews.filter(r => r.recommendedAction === 'reject').length,
    approved: reviews.filter(r => r.recommendedAction === 'approve').length,
    review: reviews.filter(r => r.recommendedAction === 'review').length,
  } : null

  return (
    <div className="space-y-6">
      {/* Stats */}
      {stats && stats.total > 0 && (
        <div className="grid grid-cols-4 gap-4">
          <StatCard label="Total Reviews" value={stats.total} />
          <StatCard label="Rejected" value={stats.rejected} color="text-red-600" />
          <StatCard label="Needs Review" value={stats.review} color="text-amber-600" />
          <StatCard label="Approved" value={stats.approved} color="text-emerald-600" />
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <History className="h-4.5 w-4.5 text-primary" />
              </div>
              <div>
                <CardTitle>Review History</CardTitle>
                <CardDescription>
                  {filtered?.length ?? 0} review{(filtered?.length ?? 0) !== 1 ? 's' : ''}
                  {riskLevelFilter !== 'all' ? ` (${riskLevelFilter} risk)` : ''}
                </CardDescription>
              </div>
            </div>
            <div className="flex gap-1 bg-secondary rounded-lg p-1">
              {filters.map((level) => (
                <Button
                  key={level}
                  variant={riskLevelFilter === level ? 'default' : 'ghost'}
                  size="sm"
                  className="text-xs h-7 px-3"
                  onClick={() => setRiskLevelFilter(level)}
                >
                  {level === 'all' ? 'All' : level.charAt(0).toUpperCase() + level.slice(1)}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading reviews...
            </div>
          ) : !filtered || filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <p className="text-lg font-medium">No reviews yet</p>
              <p className="text-sm mt-1">Submit a merchant to get started.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Merchant</TableHead>
                  <TableHead>UPI ID</TableHead>
                  <TableHead className="text-center">Score</TableHead>
                  <TableHead className="text-center">Risk</TableHead>
                  <TableHead className="text-center">Action</TableHead>
                  <TableHead className="text-right">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => {
                  const ac = actionConfig[r.recommendedAction]
                  const AcIcon = ac.icon
                  return (
                    <TableRow
                      key={r.id}
                      className="cursor-pointer hover:bg-secondary/50 transition-colors"
                      onClick={() => router.push(`/review/${r.id}`)}
                    >
                      <TableCell className="font-medium">
                        {r.merchantInput?.merchantName || 'Unknown'}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {r.merchantInput?.upiId || '-'}
                      </TableCell>
                      <TableCell className="text-center">
                        <span
                          className="font-bold tabular-nums"
                          style={{
                            color: r.riskScore >= 70 ? 'hsl(0,72%,51%)' : r.riskScore >= 40 ? 'hsl(38,92%,50%)' : 'hsl(142,71%,45%)',
                          }}
                        >
                          {r.riskScore}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={riskLevelVariant[r.riskLevel]} className="uppercase text-[10px] font-bold">
                          {r.riskLevel}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold uppercase ${ac.className}`}>
                          <AcIcon className="h-3 w-3" />
                          {r.recommendedAction}
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground text-sm">
                        {new Date(r.reviewedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <Card>
      <CardContent className="pt-5 pb-4 text-center">
        <div className={`text-2xl font-bold tabular-nums ${color || ''}`}>{value}</div>
        <div className="text-[11px] text-muted-foreground font-medium mt-0.5">{label}</div>
      </CardContent>
    </Card>
  )
}

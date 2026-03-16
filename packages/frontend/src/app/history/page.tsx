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
import { Loader2 } from 'lucide-react'

const riskLevelVariant = {
  low: 'default' as const,
  medium: 'secondary' as const,
  high: 'destructive' as const,
}

const actionColors: Record<string, string> = {
  reject: 'bg-red-600',
  review: 'bg-yellow-500',
  approve: 'bg-green-600',
}

const filters = ['all', 'low', 'medium', 'high'] as const

export default function HistoryPage() {
  const router = useRouter()
  const { data: reviews, isLoading } = useListReviews()
  const { riskLevelFilter, setRiskLevelFilter } = useAppStore()

  const filtered = reviews?.filter(
    (r) => riskLevelFilter === 'all' || r.riskLevel === riskLevelFilter
  )

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Review History</CardTitle>
            <CardDescription>
              {filtered?.length ?? 0} review{(filtered?.length ?? 0) !== 1 ? 's' : ''}
              {riskLevelFilter !== 'all' ? ` (${riskLevelFilter} risk)` : ''}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {filters.map((level) => (
              <Button
                key={level}
                variant={riskLevelFilter === level ? 'default' : 'outline'}
                size="sm"
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
          <div className="flex items-center justify-center py-10 text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading...
          </div>
        ) : !filtered || filtered.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            No reviews yet.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Merchant</TableHead>
                <TableHead>UPI ID</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Risk</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => (
                <TableRow
                  key={r.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/review/${r.id}`)}
                >
                  <TableCell className="font-medium">
                    {r.merchantInput?.merchantName || 'Unknown'}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {r.merchantInput?.upiId || '-'}
                  </TableCell>
                  <TableCell>
                    <span
                      className="font-semibold"
                      style={{
                        color: r.riskScore >= 70 ? 'hsl(0,72%,51%)' : r.riskScore >= 40 ? 'hsl(38,92%,50%)' : 'hsl(142,71%,45%)',
                      }}
                    >
                      {r.riskScore}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={riskLevelVariant[r.riskLevel]} className="uppercase text-[10px]">
                      {r.riskLevel}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase text-white ${actionColors[r.recommendedAction]}`}>
                      {r.recommendedAction}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(r.reviewedAt).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}

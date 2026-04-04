import type { BlockStat } from '@/lib/nerve-blocks'
import EmptyChart from '@/components/analytics/EmptyChart'

function rateColor(rate: number): string {
  if (rate >= 80) return 'bg-emerald-500'
  if (rate >= 60) return 'bg-yellow-500'
  return 'bg-red-500'
}

function rateTextColor(rate: number): string {
  if (rate >= 80) return 'text-emerald-400'
  if (rate >= 60) return 'text-yellow-400'
  return 'text-red-400'
}

export default function SuccessRateChart({ data }: { data: BlockStat[] }) {
  if (data.length === 0) return <EmptyChart />

  const sorted = [...data].sort((a, b) => b.successRate - a.successRate)

  return (
    <div className="flex flex-col gap-3">
      {sorted.map((d) => (
        <div key={d.block_type} className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="font-medium text-slate-300 truncate max-w-[60%]">{d.block_type}</span>
            <div className="flex items-center gap-3 flex-shrink-0">
              <span className="text-slate-600">{d.success}/{d.total}</span>
              <span className={`font-bold w-10 text-right ${rateTextColor(d.successRate)}`}>
                {d.successRate}%
              </span>
            </div>
          </div>
          <div className="relative h-2 w-full overflow-hidden rounded-full bg-gray-700">
            {/* Red failure base */}
            <div className="absolute inset-0 rounded-full bg-red-900/60" />
            {/* Success overlay */}
            <div
              className={`absolute inset-y-0 left-0 rounded-full transition-all ${rateColor(d.successRate)}`}
              style={{ width: `${d.successRate}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

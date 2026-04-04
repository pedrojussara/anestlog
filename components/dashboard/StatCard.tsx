interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ReactNode
  accent?: 'cyan' | 'green' | 'red' | 'orange' | 'purple'
  trend?: { value: number; label: string }
}

const ACCENT = {
  cyan:   { bg: 'bg-cyan-500/10',   icon: 'text-cyan-400',   ring: 'ring-cyan-500/20',   value: 'text-cyan-400' },
  green:  { bg: 'bg-emerald-500/10',icon: 'text-emerald-400',ring: 'ring-emerald-500/20',value: 'text-emerald-400' },
  red:    { bg: 'bg-red-500/10',    icon: 'text-red-400',    ring: 'ring-red-500/20',    value: 'text-red-400' },
  orange: { bg: 'bg-orange-500/10', icon: 'text-orange-400', ring: 'ring-orange-500/20', value: 'text-orange-400' },
  purple: { bg: 'bg-violet-500/10', icon: 'text-violet-400', ring: 'ring-violet-500/20', value: 'text-violet-400' },
}

export default function StatCard({
  title, value, subtitle, icon, accent = 'cyan', trend,
}: StatCardProps) {
  const a = ACCENT[accent]

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-gray-700 bg-gray-800 p-5 shadow-lg">
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-slate-400">{title}</p>
        <div className={`rounded-xl p-2 ring-1 ${a.bg} ${a.ring}`}>
          <span className={a.icon}>{icon}</span>
        </div>
      </div>

      <div>
        <p className={`text-3xl font-bold tracking-tight ${a.value}`}>{value}</p>
        {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
      </div>

      {trend && (
        <div className="flex items-center gap-1 text-xs">
          <span className={trend.value >= 0 ? 'text-emerald-400' : 'text-red-400'}>
            {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}%
          </span>
          <span className="text-slate-600">{trend.label}</span>
        </div>
      )}
    </div>
  )
}

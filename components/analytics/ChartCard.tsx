interface Props {
  title: string
  subtitle?: string
  children: React.ReactNode
  action?: React.ReactNode
  className?: string
}

export default function ChartCard({ title, subtitle, children, action, className = '' }: Props) {
  return (
    <div className={`rounded-2xl border border-gray-700 bg-gray-800 overflow-hidden ${className}`}>
      <div className="flex items-start justify-between gap-3 border-b border-gray-700/60 px-5 py-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-200">{title}</h3>
          {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
        </div>
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

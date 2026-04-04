interface Props {
  data: { specialty: string; count: number }[]
  total: number
}

export default function SpecialtyBar({ data, total }: Props) {
  if (data.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center text-sm text-slate-600">
        Nenhuma especialidade registrada
      </div>
    )
  }

  const colors = ['bg-cyan-500', 'bg-violet-500', 'bg-emerald-500', 'bg-orange-500', 'bg-pink-500']

  return (
    <div className="flex flex-col gap-3">
      {data.slice(0, 6).map((item, i) => {
        const pct = total > 0 ? Math.round((item.count / total) * 100) : 0
        return (
          <div key={item.specialty} className="flex flex-col gap-1">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium truncate max-w-[70%]">{item.specialty}</span>
              <span className="text-slate-500">{item.count} ({pct}%)</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-gray-700">
              <div
                className={`h-full rounded-full transition-all ${colors[i % colors.length]}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

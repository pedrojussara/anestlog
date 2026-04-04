import { BarChart2 } from 'lucide-react'

export default function EmptyChart({ height = 200 }: { height?: number }) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-2 text-slate-700"
      style={{ height }}
    >
      <BarChart2 size={28} />
      <p className="text-xs">Sem dados para o período</p>
    </div>
  )
}

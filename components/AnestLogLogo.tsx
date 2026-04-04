import { Activity } from 'lucide-react'

interface Props {
  size?: 'sm' | 'md' | 'lg'
}

export default function AnestLogLogo({ size = 'md' }: Props) {
  const sizes = {
    sm: { px: 18, title: 'text-lg',  sub: 'text-xs' },
    md: { px: 24, title: 'text-2xl', sub: 'text-sm' },
    lg: { px: 32, title: 'text-3xl', sub: 'text-base' },
  }
  const s = sizes[size]

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center justify-center rounded-2xl bg-cyan-500/10 p-3 ring-1 ring-cyan-500/30">
        <Activity size={s.px} className="text-cyan-400" strokeWidth={2.5} />
      </div>
      <div className="text-center">
        <h1 className={`${s.title} font-bold tracking-tight text-slate-100`}>
          Anest<span className="text-cyan-400">Log</span>
        </h1>
        <p className={`${s.sub} text-slate-500`}>Registre. Analise. Evolua.</p>
      </div>
    </div>
  )
}

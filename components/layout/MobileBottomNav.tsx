'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, BarChart2, Target, PlusCircle,
  MoreHorizontal, Stethoscope, Zap, XCircle, Users, UserCircle, X,
} from 'lucide-react'

const mainItems = [
  { href: '/dashboard',          label: 'Início',   icon: LayoutDashboard },
  { href: '/dashboard/graficos', label: 'Gráficos', icon: BarChart2 },
  { href: '/dashboard/metas',    label: 'Metas',    icon: Target },
]

const moreItems = [
  { href: '/dashboard/cirurgias',   label: 'Histórico', icon: Stethoscope },
  { href: '/dashboard/bloqueios',   label: 'Bloqueios', icon: Zap },
  { href: '/dashboard/falhas',      label: 'Falhas',    icon: XCircle },
  { href: '/dashboard/comparacoes', label: 'Social',    icon: Users },
  { href: '/dashboard/perfil',      label: 'Perfil',    icon: UserCircle },
]

export default function MobileBottomNav() {
  const pathname = usePathname()
  const [moreOpen, setMoreOpen] = useState(false)

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href)

  const isMoreActive = moreItems.some((item) => isActive(item.href))

  return (
    <>
      {/* Mais overlay */}
      {moreOpen && (
        <div className="fixed inset-0 z-40 flex flex-col justify-end md:hidden">
          {/* Backdrop */}
          <button
            aria-label="Fechar menu"
            className="absolute inset-0 bg-black/60"
            onClick={() => setMoreOpen(false)}
          />

          {/* Sheet */}
          <div className="relative z-50 rounded-t-2xl border-t border-gray-700 bg-gray-900 px-4 pb-6 pt-4">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-300">Mais opções</span>
              <button
                aria-label="Fechar"
                onClick={() => setMoreOpen(false)}
                className="rounded-full p-1 text-slate-500 hover:text-slate-300 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-4 gap-3">
              {moreItems.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMoreOpen(false)}
                  className={`flex flex-col items-center gap-2 rounded-xl p-3 transition-colors
                    ${isActive(href)
                      ? 'bg-cyan-500/15 text-cyan-400'
                      : 'bg-gray-800 text-slate-400 hover:text-slate-100'
                    }`}
                >
                  <Icon size={22} />
                  <span className="text-xs font-medium">{label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bottom nav bar */}
      <nav className="flex md:hidden border-t border-gray-800 bg-gray-900 safe-area-bottom">
        {/* Left items */}
        {mainItems.slice(0, 2).map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`flex flex-1 flex-col items-center gap-1 py-3 text-xs transition-colors
              ${isActive(href) ? 'text-cyan-400' : 'text-slate-500 hover:text-cyan-400'}`}
          >
            <Icon size={20} />
            <span>{label}</span>
          </Link>
        ))}

        {/* Center: Nova Cirurgia */}
        <Link
          href="/dashboard/cirurgias/nova"
          className="flex flex-col items-center justify-center px-3 py-1 -mt-4"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-cyan-500 shadow-lg shadow-cyan-500/30 hover:bg-cyan-400 transition-colors">
            <PlusCircle size={26} className="text-gray-900" />
          </div>
          <span className="mt-0.5 text-[10px] text-slate-500">Nova</span>
        </Link>

        {/* Right items */}
        {mainItems.slice(2).map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`flex flex-1 flex-col items-center gap-1 py-3 text-xs transition-colors
              ${isActive(href) ? 'text-cyan-400' : 'text-slate-500 hover:text-cyan-400'}`}
          >
            <Icon size={20} />
            <span>{label}</span>
          </Link>
        ))}

        {/* Mais */}
        <button
          onClick={() => setMoreOpen(true)}
          className={`flex flex-1 flex-col items-center gap-1 py-3 text-xs transition-colors
            ${isMoreActive ? 'text-cyan-400' : 'text-slate-500 hover:text-cyan-400'}`}
        >
          <MoreHorizontal size={20} />
          <span>Mais</span>
        </button>
      </nav>
    </>
  )
}

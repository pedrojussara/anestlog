import Link from 'next/link'
import {
  Activity, LayoutDashboard, Stethoscope, LogOut, PlusCircle,
  BarChart2, Zap, XCircle, Users, UserCircle, Target,
} from 'lucide-react'
import { logout } from '@/app/actions/auth'
import MobileBottomNav from '@/components/layout/MobileBottomNav'

const navItems = [
  { href: '/dashboard',              label: 'Início',    icon: LayoutDashboard },
  { href: '/dashboard/cirurgias',    label: 'Histórico', icon: Stethoscope },
  { href: '/dashboard/graficos',     label: 'Gráficos',  icon: BarChart2 },
  { href: '/dashboard/bloqueios',    label: 'Bloqueios', icon: Zap },
  { href: '/dashboard/falhas',       label: 'Falhas',    icon: XCircle },
  { href: '/dashboard/metas',        label: 'Metas',     icon: Target },
  { href: '/dashboard/comparacoes',  label: 'Social',    icon: Users },
  { href: '/dashboard/perfil',       label: 'Perfil',    icon: UserCircle },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-950 text-slate-100">
      {/* Sidebar desktop */}
      <aside className="hidden md:flex w-60 flex-col border-r border-gray-800 bg-gray-900">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-gray-800">
          <div className="flex items-center justify-center rounded-lg bg-cyan-500/10 p-1.5">
            <Activity size={18} className="text-cyan-400" strokeWidth={2.5} />
          </div>
          <span className="text-base font-bold tracking-tight">
            Anest<span className="text-cyan-400">Log</span>
          </span>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-1 p-3 flex-1">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-400
                         hover:bg-gray-800 hover:text-slate-100 transition-colors"
            >
              <Icon size={16} />
              {label}
            </Link>
          ))}
        </nav>

        {/* Nova cirurgia CTA */}
        <div className="px-3 pb-2">
          <Link
            href="/dashboard/cirurgias/nova"
            className="flex items-center justify-center gap-2 w-full rounded-lg bg-cyan-500 px-3 py-2.5
                       text-sm font-semibold text-gray-900 hover:bg-cyan-400 transition-colors"
          >
            <PlusCircle size={15} />
            Nova Cirurgia
          </Link>
        </div>

        {/* Logout */}
        <div className="p-3 border-t border-gray-800">
          <form action={logout}>
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm
                         text-slate-500 hover:bg-gray-800 hover:text-red-400 transition-colors"
            >
              <LogOut size={16} />
              Sair
            </button>
          </form>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Mobile header */}
        <header className="flex md:hidden items-center justify-between border-b border-gray-800 bg-gray-900 px-4 py-3">
          <div className="flex items-center gap-2">
            <Activity size={18} className="text-cyan-400" strokeWidth={2.5} />
            <span className="font-bold text-sm">
              Anest<span className="text-cyan-400">Log</span>
            </span>
          </div>
          <form action={logout}>
            <button type="submit" className="text-slate-500 hover:text-red-400 transition-colors p-1">
              <LogOut size={18} />
            </button>
          </form>
        </header>

        {/* Page content — pb-28 on mobile to clear the bottom nav */}
        <main className="flex-1 overflow-auto p-4 pb-28 md:p-6 md:pb-6 lg:p-8">
          {children}
        </main>

        {/* Mobile bottom nav (client component for active-state + Mais drawer) */}
        <MobileBottomNav />
      </div>
    </div>
  )
}

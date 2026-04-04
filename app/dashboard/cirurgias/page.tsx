import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import Link from 'next/link'
import { PlusCircle, Stethoscope } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getSurgeries, type SurgeriesFilter } from '@/lib/surgeries'
import type { AnesthesiaType } from '@/types'

import CirurgiaCard from '@/components/cirurgias/CirurgiaCard'
import CirurgiasFilters from '@/components/cirurgias/CirurgiasFilters'
import Pagination from '@/components/cirurgias/Pagination'

interface Props {
  searchParams: Promise<{
    search?: string
    specialty?: string
    anesthesia?: string
    period?: string
    status?: string
    page?: string
  }>
}

export default async function CirurgiasPage({ searchParams }: Props) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const sp = await searchParams
  const page = Math.max(1, Number(sp.page ?? 1))

  const filters: SurgeriesFilter = {
    search:    sp.search,
    specialty: sp.specialty,
    anesthesia: sp.anesthesia as AnesthesiaType | undefined,
    period:    (sp.period as SurgeriesFilter['period']) ?? 'all',
    status:    sp.status as SurgeriesFilter['status'] | undefined,
    page,
  }

  const { surgeries, total } = await getSurgeries(supabase, user.id, filters)

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Histórico de Cirurgias</h1>
          <p className="text-xs text-slate-500 mt-0.5">Todos os procedimentos registrados</p>
        </div>
        <Link
          href="/dashboard/cirurgias/nova"
          className="flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2.5
                     text-sm font-semibold text-gray-900 hover:bg-cyan-400 transition-colors"
        >
          <PlusCircle size={15} />
          <span className="hidden sm:inline">Nova Cirurgia</span>
          <span className="sm:hidden">Nova</span>
        </Link>
      </div>

      {/* Filtros */}
      <Suspense>
        <CirurgiasFilters totalShown={surgeries.length} total={total} />
      </Suspense>

      {/* Lista */}
      {surgeries.length === 0 ? (
        <EmptyState hasFilters={!!(sp.search || sp.specialty || sp.anesthesia || sp.status || (sp.period && sp.period !== 'all'))} />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {surgeries.map((surgery) => (
              <CirurgiaCard key={surgery.id} surgery={surgery} />
            ))}
          </div>

          <Suspense>
            <Pagination total={total} currentPage={page} />
          </Suspense>
        </>
      )}
    </div>
  )
}

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-gray-700 bg-gray-800/40 py-16 text-center">
      <div className="rounded-2xl bg-gray-800 p-4">
        <Stethoscope size={28} className="text-slate-600" />
      </div>
      {hasFilters ? (
        <>
          <p className="text-sm font-medium text-slate-400">Nenhuma cirurgia encontrada</p>
          <p className="text-xs text-slate-600">Tente ajustar ou limpar os filtros</p>
        </>
      ) : (
        <>
          <p className="text-sm font-medium text-slate-400">Nenhuma cirurgia registrada ainda</p>
          <p className="text-xs text-slate-600">Registre sua primeira cirurgia para começar</p>
          <Link
            href="/dashboard/cirurgias/nova"
            className="mt-2 flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2.5
                       text-sm font-semibold text-gray-900 hover:bg-cyan-400 transition-colors"
          >
            <PlusCircle size={15} />
            Registrar primeira cirurgia
          </Link>
        </>
      )}
    </div>
  )
}

import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import Link from 'next/link'
import { Users, Lock, Globe, BarChart2, Activity, CheckCircle2, Stethoscope } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { buildDateRange } from '@/lib/analytics'
import { getDashboardStats } from '@/lib/dashboard'
import PeriodFilter from '@/components/analytics/PeriodFilter'

interface Props {
  searchParams: Promise<{ period?: string; from?: string; to?: string }>
}

interface PublicProfile {
  id: string
  name: string
  institution: string | null
  city: string | null
  residency_year: number | null
}

export default async function ComparacoesPage({ searchParams }: Props) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const sp = await searchParams
  const period = (sp.period ?? 'year') as 'week' | 'month' | 'year' | 'custom'
  const range  = buildDateRange(period, sp.from, sp.to)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  // Perfil do usuário atual
  const { data: myProfile } = await db
    .from('users')
    .select('id, name, institution, city, residency_year, is_public')
    .eq('id', user.id)
    .single() as { data: (PublicProfile & { is_public: boolean }) | null }

  // Stats do usuário atual
  const myStats = await getDashboardStats(supabase, user.id, period)

  // Perfis públicos (exceto o próprio)
  const { data: publicProfilesRaw } = await db
    .from('users')
    .select('id, name, institution, city, residency_year')
    .eq('is_public', true)
    .neq('id', user.id)
    .order('residency_year')

  const publicProfiles = (publicProfilesRaw ?? []) as PublicProfile[]

  // Stats de todos os perfis públicos
  const peerStatsAll = await Promise.all(
    publicProfiles.map((p) => getDashboardStats(supabase, p.id, period))
  )

  const peers = publicProfiles.map((p, i) => ({
    profile: p,
    stats: peerStatsAll[i],
  }))

  // Rank do usuário por total de cirurgias
  const allSurgeries = [
    { id: user.id, name: myProfile?.name ?? 'Você', count: myStats.total_surgeries },
    ...peers.map((p) => ({ id: p.profile.id, name: p.profile.name, count: p.stats.total_surgeries })),
  ].sort((a, b) => b.count - a.count)
  const myRank = allSurgeries.findIndex((r) => r.id === user.id) + 1

  // Médias da turma (peers com perfil público)
  const peerCounts = peers.map((p) => p.stats.total_surgeries)
  const avgSurgeries = peerCounts.length > 0
    ? Math.round(peerCounts.reduce((a, b) => a + b, 0) / peerCounts.length)
    : null

  const mySuccessRate = myStats.total_procedures > 0
    ? Math.round((myStats.procedures_by_status.success / myStats.total_procedures) * 100)
    : 0

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center rounded-lg bg-indigo-500/10 p-1.5">
            <Users size={16} className="text-indigo-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-100">Comunidade</h1>
            <p className="text-xs text-slate-500">Compare seu desempenho com outros residentes</p>
          </div>
        </div>

        {/* Visibilidade do meu perfil */}
        {myProfile && (
          <div className={[
            'flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium',
            myProfile.is_public
              ? 'border-cyan-500/30 bg-cyan-500/10 text-cyan-400'
              : 'border-gray-700 bg-gray-800 text-slate-500',
          ].join(' ')}>
            {myProfile.is_public
              ? <><Globe size={12} /> Perfil público</>
              : <><Lock size={12} /> Perfil privado</>}
          </div>
        )}
      </div>

      {/* Filtro de período */}
      <Suspense>
        <PeriodFilter />
      </Suspense>

      {/* Meu resumo */}
      <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Activity size={14} className="text-indigo-400" />
          <h2 className="text-sm font-semibold text-slate-200">Meu desempenho</h2>
          {myProfile?.residency_year && (
            <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 text-xs font-semibold text-indigo-400">
              R{myProfile.residency_year}
            </span>
          )}
          {myRank > 0 && allSurgeries.length > 1 && (
            <span className="ml-auto text-xs text-slate-500">
              #{myRank} em volume · {allSurgeries.length} residentes
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MiniStat label="Cirurgias" value={myStats.total_surgeries} color="text-cyan-400" />
          <MiniStat label="Procedimentos" value={myStats.total_procedures} color="text-violet-400" />
          <MiniStat label="Taxa de sucesso" value={`${mySuccessRate}%`} color="text-emerald-400" />
          <MiniStat label="Especialidades" value={myStats.surgeries_by_specialty.length} color="text-indigo-400" />
        </div>

        {avgSurgeries !== null && (
          <div className="mt-4 flex items-center gap-2 text-xs">
            <span className="text-slate-500">Média da turma:</span>
            <span className="font-semibold text-slate-300">{avgSurgeries} cirurgias</span>
            <span className={[
              'font-bold',
              myStats.total_surgeries >= avgSurgeries ? 'text-emerald-400' : 'text-red-400',
            ].join(' ')}>
              {myStats.total_surgeries >= avgSurgeries
                ? `▲ +${myStats.total_surgeries - avgSurgeries} acima`
                : `▼ ${avgSurgeries - myStats.total_surgeries} abaixo`}
            </span>
          </div>
        )}
      </div>

      {/* Ranking geral */}
      {allSurgeries.length > 1 && (
        <div className="rounded-2xl border border-gray-700 bg-gray-800 overflow-hidden">
          <div className="flex items-center gap-2 border-b border-gray-700 px-5 py-4">
            <BarChart2 size={14} className="text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-200">Ranking por volume de cirurgias</h2>
            <span className="ml-auto text-xs text-slate-600">{allSurgeries.length} residentes</span>
          </div>
          <div className="flex flex-col divide-y divide-gray-700/60">
            {allSurgeries.map((entry, i) => {
              const isMe = entry.id === user.id
              const pct = allSurgeries[0].count > 0
                ? Math.round((entry.count / allSurgeries[0].count) * 100)
                : 0
              return (
                <div
                  key={entry.id}
                  className={[
                    'flex items-center gap-3 px-5 py-3',
                    isMe ? 'bg-indigo-500/5' : '',
                  ].join(' ')}
                >
                  <span className={[
                    'w-6 text-center text-sm font-bold flex-shrink-0',
                    i === 0 ? 'text-yellow-400' : i === 1 ? 'text-slate-400' : i === 2 ? 'text-amber-600' : 'text-slate-600',
                  ].join(' ')}>
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`}
                  </span>
                  <span className={`flex-1 text-sm truncate ${isMe ? 'font-semibold text-indigo-300' : 'text-slate-300'}`}>
                    {isMe ? `${entry.name} (você)` : entry.name}
                  </span>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="hidden sm:block w-24 h-1.5 rounded-full bg-gray-700 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${isMe ? 'bg-indigo-500' : 'bg-gray-500'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className={`text-sm font-bold w-8 text-right ${isMe ? 'text-indigo-400' : 'text-slate-400'}`}>
                      {entry.count}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Perfis públicos */}
      {peers.length > 0 ? (
        <div className="rounded-2xl border border-gray-700 bg-gray-800 overflow-hidden">
          <div className="flex items-center gap-2 border-b border-gray-700 px-5 py-4">
            <Globe size={14} className="text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-200">Residentes com perfil público</h2>
            <span className="ml-auto text-xs text-slate-600">{peers.length} perfil{peers.length > 1 ? 's' : ''}</span>
          </div>
          <div className="grid grid-cols-1 divide-y divide-gray-700/60 sm:grid-cols-2 sm:divide-y-0 sm:gap-0">
            {peers.map(({ profile, stats }) => {
              const successRate = stats.total_procedures > 0
                ? Math.round((stats.procedures_by_status.success / stats.total_procedures) * 100)
                : 0
              return (
                <div key={profile.id} className="flex flex-col gap-3 p-5 border-gray-700/60 sm:border-r last:border-r-0">
                  <div className="flex items-start gap-2">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-700 text-sm font-bold text-slate-400">
                      {profile.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-200 truncate">{profile.name}</p>
                      <p className="text-xs text-slate-500">
                        {profile.residency_year ? `R${profile.residency_year}` : ''}
                        {profile.residency_year && profile.institution ? ' · ' : ''}
                        {profile.institution ?? ''}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <PeerStat label="Cirurgias" value={stats.total_surgeries} />
                    <PeerStat label="Sucesso" value={`${successRate}%`} />
                    <PeerStat label="Espec." value={stats.surgeries_by_specialty.length} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <NoPeersState isPrivate={!myProfile?.is_public} />
      )}
    </div>
  )
}

function MiniStat({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-lg bg-gray-900/60 p-3">
      <span className={`text-xl font-bold ${color}`}>{value}</span>
      <span className="text-xs text-slate-500">{label}</span>
    </div>
  )
}

function PeerStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-lg bg-gray-900/40 p-2">
      <span className="text-sm font-bold text-slate-300">{value}</span>
      <span className="text-[10px] text-slate-600">{label}</span>
    </div>
  )
}

function NoPeersState({ isPrivate }: { isPrivate: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-gray-700 bg-gray-800/40 py-16 text-center px-4">
      <div className="rounded-2xl bg-gray-800 p-4">
        <Users size={28} className="text-slate-600" />
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium text-slate-400">Nenhum colega com perfil público ainda</p>
        <p className="text-xs text-slate-600 max-w-xs">
          {isPrivate
            ? 'Torne seu perfil público para participar das comparações e incentivar outros a fazerem o mesmo'
            : 'Quando outros residentes tornarem seus perfis públicos, eles aparecerão aqui'}
        </p>
      </div>
      {isPrivate && (
        <Link
          href="/dashboard/perfil"
          className="flex items-center gap-2 rounded-lg border border-cyan-500/30 bg-cyan-500/10
                     px-4 py-2.5 text-sm font-semibold text-cyan-400 hover:bg-cyan-500/20 transition-colors"
        >
          <Globe size={14} />
          Tornar perfil público
        </Link>
      )}
    </div>
  )
}

'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  User, Mail, Building2, MapPin, GraduationCap, Globe, Lock,
  Save, LogOut, Camera, CheckCircle2,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'

interface Profile {
  id: string
  name: string
  email: string
  institution: string | null
  city: string | null
  residency_year: number | null
  is_public: boolean
}

const RESIDENCY_OPTIONS = [
  { value: '',  label: 'Não informado' },
  { value: '1', label: 'R1 — 1º ano' },
  { value: '2', label: 'R2 — 2º ano' },
  { value: '3', label: 'R3 — 3º ano' },
]

export default function PerfilPage() {
  const router = useRouter()
  const supabase = createClient()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Load profile once on mount
  useState(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.replace('/login'); return }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any)
        .from('users')
        .select('id, name, email, institution, city, residency_year, is_public')
        .eq('id', user.id)
        .single()
      setProfile(data ?? { id: user.id, name: '', email: user.email ?? '', institution: null, city: null, residency_year: null, is_public: false })
      setLoading(false)
    })
  })

  function set<K extends keyof Profile>(key: K, value: Profile[K]) {
    setProfile((prev) => prev ? { ...prev, [key]: value } : prev)
    setSaved(false)
  }

  function handleSave() {
    if (!profile) return
    setError(null)
    setSaved(false)

    startTransition(async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: err } = await (supabase as any)
        .from('users')
        .update({
          name:           profile.name,
          institution:    profile.institution || null,
          city:           profile.city || null,
          residency_year: profile.residency_year || null,
          is_public:      profile.is_public,
        })
        .eq('id', profile.id)

      if (err) { setError('Erro ao salvar. Tente novamente.'); return }
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    })
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.replace('/login')
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
      </div>
    )
  }

  if (!profile) return null

  const initials = profile.name
    ? profile.name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()
    : '?'

  return (
    <div className="mx-auto max-w-2xl w-full flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-100">Meu Perfil</h1>
        <p className="text-xs text-slate-500 mt-0.5">Gerencie suas informações e preferências</p>
      </div>

      {/* Avatar + nome */}
      <div className="flex items-center gap-4 rounded-2xl border border-gray-700 bg-gray-800 p-5">
        <div className="relative">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-indigo-500 text-xl font-bold text-white">
            {initials}
          </div>
          <div className="absolute -bottom-1 -right-1 rounded-full bg-gray-800 p-1">
            <Camera size={12} className="text-slate-500" />
          </div>
        </div>
        <div>
          <p className="font-semibold text-slate-200">{profile.name || 'Sem nome'}</p>
          <p className="text-xs text-slate-500">{profile.email}</p>
          {profile.residency_year && (
            <span className="mt-1 inline-block rounded-full bg-cyan-500/10 px-2 py-0.5 text-xs font-semibold text-cyan-400">
              R{profile.residency_year}
            </span>
          )}
        </div>
      </div>

      {/* Formulário */}
      <div className="rounded-2xl border border-gray-700 bg-gray-800 overflow-hidden">
        <div className="border-b border-gray-700 px-5 py-4">
          <h2 className="text-sm font-semibold text-slate-200">Informações pessoais</h2>
        </div>
        <div className="flex flex-col gap-4 p-5">
          <Field
            label="Nome completo"
            icon={<User size={14} />}
          >
            <input
              type="text"
              value={profile.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="Dr(a). Nome Sobrenome"
              className={inputCls}
            />
          </Field>

          <Field label="Email" icon={<Mail size={14} />}>
            <input
              type="email"
              value={profile.email}
              disabled
              className={`${inputCls} opacity-50 cursor-not-allowed`}
            />
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Instituição" icon={<Building2 size={14} />}>
              <input
                type="text"
                value={profile.institution ?? ''}
                onChange={(e) => set('institution', e.target.value)}
                placeholder="Hospital das Clínicas"
                className={inputCls}
              />
            </Field>

            <Field label="Cidade" icon={<MapPin size={14} />}>
              <input
                type="text"
                value={profile.city ?? ''}
                onChange={(e) => set('city', e.target.value)}
                placeholder="São Paulo"
                className={inputCls}
              />
            </Field>
          </div>

          <Field label="Ano de residência" icon={<GraduationCap size={14} />}>
            <select
              value={String(profile.residency_year ?? '')}
              onChange={(e) => set('residency_year', e.target.value ? Number(e.target.value) : null)}
              className={`${inputCls} cursor-pointer`}
            >
              {RESIDENCY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value} className="bg-gray-900">{o.label}</option>
              ))}
            </select>
          </Field>
        </div>
      </div>

      {/* Privacidade */}
      <div className="rounded-2xl border border-gray-700 bg-gray-800 overflow-hidden">
        <div className="border-b border-gray-700 px-5 py-4">
          <h2 className="text-sm font-semibold text-slate-200">Privacidade</h2>
        </div>
        <div className="p-5">
          <button
            type="button"
            onClick={() => set('is_public', !profile.is_public)}
            className={[
              'flex w-full items-center gap-4 rounded-xl border p-4 text-left transition-all',
              profile.is_public
                ? 'border-cyan-500/40 bg-cyan-500/10'
                : 'border-gray-600 bg-gray-900 hover:border-gray-500',
            ].join(' ')}
          >
            {profile.is_public
              ? <Globe size={18} className="text-cyan-400 flex-shrink-0" />
              : <Lock  size={18} className="text-slate-500 flex-shrink-0" />}
            <div className="flex-1">
              <p className={`text-sm font-semibold ${profile.is_public ? 'text-cyan-300' : 'text-slate-400'}`}>
                {profile.is_public ? 'Perfil público' : 'Perfil privado'}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {profile.is_public
                  ? 'Outros residentes podem ver suas estatísticas na seção de Comparações'
                  : 'Seus dados são visíveis apenas para você'}
              </p>
            </div>
            {/* Toggle pill */}
            <div className={[
              'relative h-5 w-9 flex-shrink-0 rounded-full transition-colors',
              profile.is_public ? 'bg-cyan-500' : 'bg-gray-600',
            ].join(' ')}>
              <span className={[
                'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform',
                profile.is_public ? 'translate-x-4' : 'translate-x-0.5',
              ].join(' ')} />
            </div>
          </button>
        </div>
      </div>

      {/* Feedback + Save */}
      {error && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </p>
      )}

      {saved && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
          <CheckCircle2 size={15} />
          Perfil salvo com sucesso!
        </div>
      )}

      <div className="flex flex-col gap-3 pb-8 sm:flex-row sm:justify-between sm:items-center">
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 rounded-lg border border-gray-700 px-4 py-2.5
                     text-sm text-slate-500 hover:border-red-500/30 hover:text-red-400 transition-colors"
        >
          <LogOut size={15} />
          Sair da conta
        </button>

        <Button onClick={handleSave} loading={isPending}>
          <Save size={15} />
          Salvar alterações
        </Button>
      </div>
    </div>
  )
}

const inputCls = [
  'w-full rounded-lg border border-gray-600 bg-gray-900',
  'px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-600',
  'outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all',
].join(' ')

function Field({
  label, icon, children,
}: {
  label: string; icon?: React.ReactNode; children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
        {icon && <span className="text-slate-600">{icon}</span>}
        {label}
      </label>
      {children}
    </div>
  )
}

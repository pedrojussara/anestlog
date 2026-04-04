'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { User, Mail, Lock, Building2, MapPin, Globe } from 'lucide-react'
import { register } from '@/app/actions/auth'
import AnestLogLogo from '@/components/AnestLogLogo'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'

const RESIDENCY_OPTIONS = [
  { value: '', label: 'Selecione o ano...' },
  { value: '1', label: 'R1 — 1º ano' },
  { value: '2', label: 'R2 — 2º ano' },
  { value: '3', label: 'R3 — 3º ano' },
]

export default function RegisterPage() {
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [isPublic, setIsPublic] = useState(false)
  const [isPending, startTransition] = useTransition()

  function validate(data: FormData): Record<string, string> {
    const errs: Record<string, string> = {}
    if (!data.get('name')) errs.name = 'Nome é obrigatório.'
    if (!data.get('email')) errs.email = 'Email é obrigatório.'
    const pw = data.get('password') as string
    const pw2 = data.get('confirm_password') as string
    if (!pw || pw.length < 6) errs.password = 'Senha deve ter no mínimo 6 caracteres.'
    if (pw !== pw2) errs.confirm_password = 'As senhas não coincidem.'
    if (!data.get('residency_year')) errs.residency_year = 'Selecione o ano de residência.'
    return errs
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setServerError(null)
    const formData = new FormData(e.currentTarget)
    formData.set('is_public', String(isPublic))

    const errs = validate(formData)
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    setErrors({})

    startTransition(async () => {
      const result = await register(formData)
      if (result?.error) setServerError(result.error)
    })
  }

  return (
    <div className="flex flex-col gap-8">
      <AnestLogLogo size="md" />

      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-8 shadow-2xl backdrop-blur-sm">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-slate-100">Criar conta</h2>
          <p className="mt-1 text-sm text-slate-500">
            Comece a registrar seus procedimentos
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Dados pessoais */}
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-600">
            Dados pessoais
          </p>

          <Input
            label="Nome completo"
            name="name"
            type="text"
            placeholder="Dr(a). João Silva"
            autoComplete="name"
            required
            error={errors.name}
            icon={<User size={16} />}
          />

          <Input
            label="Email"
            name="email"
            type="email"
            placeholder="seu@email.com"
            autoComplete="email"
            required
            error={errors.email}
            icon={<Mail size={16} />}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Senha"
              name="password"
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              required
              error={errors.password}
              icon={<Lock size={16} />}
            />
            <Input
              label="Confirmar senha"
              name="confirm_password"
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              required
              error={errors.confirm_password}
              icon={<Lock size={16} />}
            />
          </div>

          {/* Dados da residência */}
          <p className="mt-2 text-xs font-semibold uppercase tracking-widest text-slate-600">
            Residência
          </p>

          <Input
            label="Instituição"
            name="institution"
            type="text"
            placeholder="Hospital das Clínicas"
            icon={<Building2 size={16} />}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Cidade"
              name="city"
              type="text"
              placeholder="São Paulo"
              icon={<MapPin size={16} />}
            />
            <Select
              label="Ano de residência"
              name="residency_year"
              options={RESIDENCY_OPTIONS}
              error={errors.residency_year}
            />
          </div>

          {/* Visibilidade do perfil */}
          <p className="mt-2 text-xs font-semibold uppercase tracking-widest text-slate-600">
            Privacidade
          </p>

          <button
            type="button"
            onClick={() => setIsPublic((v) => !v)}
            className={[
              'flex items-center gap-3 rounded-lg border p-4 text-left transition-all',
              isPublic
                ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-300'
                : 'border-slate-700 bg-slate-800/40 text-slate-400',
            ].join(' ')}
          >
            <Globe size={18} className={isPublic ? 'text-cyan-400' : 'text-slate-500'} />
            <div>
              <p className="text-sm font-medium">
                {isPublic ? 'Perfil público' : 'Perfil privado'}
              </p>
              <p className="text-xs text-slate-500">
                {isPublic
                  ? 'Outros residentes podem ver suas estatísticas'
                  : 'Apenas você vê seus dados'}
              </p>
            </div>
            {/* Toggle pill */}
            <div className="ml-auto">
              <div
                className={[
                  'relative h-5 w-9 rounded-full transition-colors',
                  isPublic ? 'bg-cyan-500' : 'bg-slate-700',
                ].join(' ')}
              >
                <span
                  className={[
                    'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform',
                    isPublic ? 'translate-x-4' : 'translate-x-0.5',
                  ].join(' ')}
                />
              </div>
            </div>
          </button>

          {serverError && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {serverError}
            </div>
          )}

          <Button type="submit" fullWidth loading={isPending} className="mt-2">
            Criar conta
          </Button>
        </form>
      </div>

      <p className="text-center text-sm text-slate-500">
        Já tem conta?{' '}
        <Link
          href="/login"
          className="font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
        >
          Entrar
        </Link>
      </p>
    </div>
  )
}

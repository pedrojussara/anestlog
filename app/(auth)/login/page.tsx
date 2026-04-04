'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Mail, Lock } from 'lucide-react'
import { login } from '@/app/actions/auth'
import AnestLogLogo from '@/components/AnestLogLogo'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const result = await login(formData)
      if (result?.error) setError(result.error)
    })
  }

  return (
    <div className="flex flex-col gap-8">
      <AnestLogLogo size="lg" />

      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-8 shadow-2xl backdrop-blur-sm">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-slate-100">Entrar na conta</h2>
          <p className="mt-1 text-sm text-slate-500">
            Acesse seu histórico de procedimentos
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Email"
            name="email"
            type="email"
            placeholder="seu@email.com"
            autoComplete="email"
            required
            icon={<Mail size={16} />}
          />

          <Input
            label="Senha"
            name="password"
            type="password"
            placeholder="••••••••"
            autoComplete="current-password"
            required
            icon={<Lock size={16} />}
          />

          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <Button type="submit" fullWidth loading={isPending} className="mt-2">
            Entrar
          </Button>
        </form>
      </div>

      <p className="text-center text-sm text-slate-500">
        Ainda não tem conta?{' '}
        <Link
          href="/register"
          className="font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
        >
          Criar conta
        </Link>
      </p>
    </div>
  )
}

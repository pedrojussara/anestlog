import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import NovaCirurgiaForm from '@/components/cirurgias/NovaCirurgiaForm'

export default async function NovaCirurgiaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="mx-auto max-w-2xl w-full">
      {/* Header da página */}
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/dashboard"
          className="rounded-lg p-2 text-slate-500 hover:bg-gray-800 hover:text-slate-300 transition-colors"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-lg font-bold text-slate-100">Nova Cirurgia</h1>
          <p className="text-xs text-slate-500">Registre os procedimentos realizados</p>
        </div>
      </div>

      <NovaCirurgiaForm />
    </div>
  )
}

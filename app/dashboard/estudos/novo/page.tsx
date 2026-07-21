import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import NovaSessaoForm from '@/components/estudos/NovaSessaoForm'
import type { TopicOption } from '@/components/estudos/TopicSelect'

export default async function NovoEstudoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  const { data: topicsRaw } = await db
    .from('study_topics')
    .select('id, name, area, is_custom')
    .order('area', { ascending: true })
    .order('name', { ascending: true })

  const topics = (topicsRaw ?? []) as TopicOption[]

  return (
    <div className="mx-auto max-w-2xl w-full">
      {/* Header da página */}
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/dashboard/estudos"
          className="rounded-lg p-2 text-slate-500 hover:bg-gray-800 hover:text-slate-300 transition-colors"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-lg font-bold text-slate-100">Registrar Estudo</h1>
          <p className="text-xs text-slate-500">As revisões serão agendadas automaticamente</p>
        </div>
      </div>

      <NovaSessaoForm topics={topics} />
    </div>
  )
}

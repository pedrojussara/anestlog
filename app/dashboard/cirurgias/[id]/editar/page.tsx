import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import EditCirurgiaForm from '@/components/cirurgias/EditCirurgiaForm'
import type { AnesthesiaType } from '@/types'
import type { ProcedureInput } from '@/app/actions/surgeries'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditarCirurgiaPage({ params }: Props) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  const { data: surgery } = await db
    .from('surgeries')
    .select(`
      id, date, specialty, surgery_name, anesthesia_types, notes,
      procedures (
        id, type, status, is_difficult_airway, notes,
        attempts, patient_position, puncture_approach, armored_tube, guide_wire,
        nerve_blocks ( block_type, postop_pain_level )
      )
    `)
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!surgery) notFound()

  const initialData = {
    date: surgery.date,
    specialty: surgery.specialty,
    surgery_name: surgery.surgery_name,
    anesthesia_types: surgery.anesthesia_types as AnesthesiaType[],
    notes: surgery.notes,
    procedures: (surgery.procedures ?? []).map((p: {
      type: string
      status: 'success' | 'failure'
      is_difficult_airway: boolean
      notes: string | null
      attempts: number | null
      patient_position: string | null
      puncture_approach: string | null
      armored_tube: boolean
      guide_wire: boolean
      nerve_blocks: { block_type: string; postop_pain_level: number | null }[]
    }): ProcedureInput => ({
      type: p.type,
      status: p.status,
      is_difficult_airway: p.is_difficult_airway,
      notes: p.notes ?? '',
      attempts: p.attempts,
      patient_position: p.patient_position,
      puncture_approach: p.puncture_approach,
      armored_tube: p.armored_tube,
      guide_wire: p.guide_wire,
      nerve_block_type: p.nerve_blocks?.[0]?.block_type ?? undefined,
      nerve_block_pain: p.nerve_blocks?.[0]?.postop_pain_level ?? null,
    })),
  }

  return (
    <div className="mx-auto max-w-2xl w-full">
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/dashboard/cirurgias"
          className="rounded-lg p-2 text-slate-500 hover:bg-gray-800 hover:text-slate-300 transition-colors"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-lg font-bold text-slate-100">Editar Cirurgia</h1>
          <p className="text-xs text-slate-500">Atualize os dados do procedimento</p>
        </div>
      </div>

      <EditCirurgiaForm surgeryId={id} initialData={initialData} />
    </div>
  )
}

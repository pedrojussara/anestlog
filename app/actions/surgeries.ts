'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { AnesthesiaType } from '@/types'

export interface ProcedureInput {
  type: string
  status: 'success' | 'failure'
  is_difficult_airway: boolean
  notes: string
  attempts?: number | null           // raquidiana e peridural
  patient_position?: string | null   // 'sentado' | 'decubito_lateral'
  puncture_approach?: string | null  // 'mediana' | 'paramediana'
  nerve_block_type?: string
  nerve_block_pain?: number | null
}

export interface SurgeryInput {
  date: string
  specialty: string
  surgery_name?: string
  anesthesia_types: AnesthesiaType[]
  notes: string
  procedures: ProcedureInput[]
}

export async function saveSurgery(input: SurgeryInput) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado.' }

  if (!input.date) return { error: 'Data obrigatória.' }
  if (!input.specialty) return { error: 'Especialidade obrigatória.' }
  if (input.anesthesia_types.length === 0) return { error: 'Selecione ao menos um tipo de anestesia.' }
  if (input.procedures.length === 0) return { error: 'Adicione ao menos um procedimento.' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  // 1. Insert surgery
  const { data: surgery, error: surgeryError } = await db
    .from('surgeries')
    .insert({
      user_id: user.id,
      date: input.date,
      specialty: input.specialty,
      surgery_name: input.surgery_name || null,
      anesthesia_types: input.anesthesia_types,
      notes: input.notes || null,
    })
    .select('id')
    .single()

  if (surgeryError) return { error: 'Erro ao salvar cirurgia.' }

  // 2. Insert procedures
  for (const proc of input.procedures) {
    const { data: procedure, error: procError } = await db
      .from('procedures')
      .insert({
        surgery_id: surgery.id,
        type: proc.type,
        status: proc.status,
        is_difficult_airway: proc.is_difficult_airway,
        notes: proc.notes || null,
        attempts:          proc.attempts ?? null,
        patient_position:  proc.patient_position || null,
        puncture_approach: proc.puncture_approach || null,
      })
      .select('id')
      .single()

    if (procError) return { error: 'Erro ao salvar procedimento.' }

    // 3. Insert nerve block if applicable
    if (proc.type === 'bloqueio_periferico' && proc.nerve_block_type) {
      const { error: blockError } = await db.from('nerve_blocks').insert({
        procedure_id: procedure.id,
        block_type: proc.nerve_block_type,
        postop_pain_level: proc.nerve_block_pain ?? null,
      })
      if (blockError) return { error: 'Erro ao salvar bloqueio.' }
    }
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/cirurgias')
  redirect('/dashboard')
}

export async function deleteSurgery(surgeryId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado.' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  // Verifica que a cirurgia pertence ao usuário antes de deletar
  const { data: surgery } = await db
    .from('surgeries')
    .select('id')
    .eq('id', surgeryId)
    .eq('user_id', user.id)
    .single()

  if (!surgery) return { error: 'Cirurgia não encontrada.' }

  const { error } = await db.from('surgeries').delete().eq('id', surgeryId)
  if (error) return { error: 'Erro ao deletar cirurgia.' }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/cirurgias')
}

'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export interface GoalInput {
  procedure_type: string
  target_count: number
  deadline?: string | null   // ISO date string "YYYY-MM-DD"
  block_type?: string | null // only for bloqueio_periferico
}

export async function saveGoal(input: GoalInput) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado.' }
  if (input.target_count < 1) return { error: 'A meta deve ser maior que zero.' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  // Manual upsert — needed because onConflict can't reference functional indexes
  let selectQuery = db
    .from('goals')
    .select('id')
    .eq('user_id', user.id)
    .eq('procedure_type', input.procedure_type)

  if (input.block_type) {
    selectQuery = selectQuery.eq('block_type', input.block_type)
  } else {
    selectQuery = selectQuery.is('block_type', null)
  }

  const { data: existing } = await selectQuery.maybeSingle()

  let error: unknown
  if (existing) {
    ;({ error } = await db
      .from('goals')
      .update({
        target_count: input.target_count,
        deadline: input.deadline || null,
      })
      .eq('id', existing.id))
  } else {
    ;({ error } = await db.from('goals').insert({
      user_id:        user.id,
      procedure_type: input.procedure_type,
      target_count:   input.target_count,
      deadline:       input.deadline || null,
      block_type:     input.block_type || null,
    }))
  }

  if (error) return { error: 'Erro ao salvar meta.' }
  revalidatePath('/dashboard/metas')
}

export async function deleteGoal(procedureType: string, blockType: string | null) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado.' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  let query = db
    .from('goals')
    .delete()
    .eq('user_id', user.id)
    .eq('procedure_type', procedureType)

  if (blockType) {
    query = query.eq('block_type', blockType)
  } else {
    query = query.is('block_type', null)
  }

  const { error } = await query
  if (error) return { error: 'Erro ao deletar meta.' }
  revalidatePath('/dashboard/metas')
}

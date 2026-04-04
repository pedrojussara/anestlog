// ============================================================
// AnestLog — Tipagens TypeScript
// Espelha o schema do Supabase (lib/supabase/schema.sql)
// ============================================================

export interface User {
  id: string
  name: string
  email: string
  institution: string | null
  city: string | null
  residency_year: 1 | 2 | 3 | 4 | 5 | null
  is_public: boolean
  created_at: string
}

export interface Surgery {
  id: string
  user_id: string
  date: string               // ISO date string (YYYY-MM-DD)
  specialty: string
  anesthesia_types: AnesthesiaType[]
  notes: string | null
  created_at: string
}

export interface Procedure {
  id: string
  surgery_id: string
  type: ProcedureType
  status: 'success' | 'failure'
  is_difficult_airway: boolean
  notes: string | null
  created_at: string
}

export interface NerveBlock {
  id: string
  procedure_id: string
  block_type: string
  postop_pain_level: number | null  // 0–10
  created_at: string
}

// ---- Enums / Literais ----

export type AnesthesiaType =
  | 'geral_inalatoria'
  | 'geral_venosa'
  | 'geral_balanceada'
  | 'raqui'
  | 'peridural'
  | 'combinada_raqui_peridural'
  | 'bloqueio_periferico'
  | 'sedacao'
  | 'local'

export type ProcedureType =
  | 'intubacao_orotraqueal'
  | 'intubacao_nasotraqueal'
  | 'mascara_laringea'
  | 'acesso_venoso_central'
  | 'acesso_arterial'
  | 'raquidiana'
  | 'peridural'
  | 'bloqueio_periferico'
  | 'outro'

// ---- Tipos compostos (joins) ----

export interface SurgeryWithProcedures extends Surgery {
  procedures: ProcedureWithBlocks[]
}

export interface ProcedureWithBlocks extends Procedure {
  nerve_blocks: NerveBlock[]
}

// ---- Dashboard ----

export interface DashboardStats {
  total_surgeries: number
  total_procedures: number
  procedures_by_status: { success: number; failure: number }
  difficult_airways: number
  surgeries_by_specialty: { specialty: string; count: number }[]
  anesthesia_type_distribution: { type: AnesthesiaType; count: number }[]
  surgeries_per_month: { month: string; count: number }[]
  nerve_blocks_by_type: { block_type: string; count: number; avg_pain: number }[]
}

// ---- Supabase Database helper type ----

export type Database = {
  public: {
    Tables: {
      users: { Row: User; Insert: Omit<User, 'created_at'>; Update: Partial<Omit<User, 'id'>> }
      surgeries: { Row: Surgery; Insert: Omit<Surgery, 'id' | 'created_at'>; Update: Partial<Omit<Surgery, 'id'>> }
      procedures: { Row: Procedure; Insert: Omit<Procedure, 'id' | 'created_at'>; Update: Partial<Omit<Procedure, 'id'>> }
      nerve_blocks: { Row: NerveBlock; Insert: Omit<NerveBlock, 'id' | 'created_at'>; Update: Partial<Omit<NerveBlock, 'id'>> }
    }
  }
}

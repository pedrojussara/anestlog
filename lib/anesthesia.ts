import type { AnesthesiaType } from '@/types'

export const ANESTHESIA_LABELS: Record<AnesthesiaType, string> = {
  geral_inalatoria: 'Geral Inalatória',
  geral_venosa: 'Geral Venosa (TIVA)',
  geral_balanceada: 'Geral Balanceada',
  raqui: 'Raquianestesia',
  peridural: 'Peridural',
  combinada_raqui_peridural: 'Combinada (Raqui + Peri)',
  bloqueio_periferico: 'Bloqueio Periférico',
  sedacao: 'Sedação',
  local: 'Anestesia Local',
}

export const ANESTHESIA_COLORS: Record<AnesthesiaType, string> = {
  geral_inalatoria: '#22d3ee',
  geral_venosa: '#818cf8',
  geral_balanceada: '#34d399',
  raqui: '#fb923c',
  peridural: '#f472b6',
  combinada_raqui_peridural: '#facc15',
  bloqueio_periferico: '#a78bfa',
  sedacao: '#94a3b8',
  local: '#6ee7b7',
}

export const ANESTHESIA_OPTIONS = Object.entries(ANESTHESIA_LABELS).map(
  ([value, label]) => ({ value, label })
)

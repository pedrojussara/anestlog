'use client'

import { Trash2, ChevronDown, CheckCircle2, XCircle, Wind, Activity } from 'lucide-react'
import { PROCEDURE_TYPES, NERVE_BLOCK_GROUPS, INTUBATION_TYPES, type ProcedureTypeValue } from '@/lib/constants'
import type { ProcedureInput } from '@/app/actions/surgeries'

interface Props {
  index: number
  procedure: ProcedureInput
  onChange: (updated: ProcedureInput) => void
  onRemove: () => void
  canRemove: boolean
}

const PROC_GROUPS = PROCEDURE_TYPES.reduce<Record<string, typeof PROCEDURE_TYPES[number][]>>(
  (acc, p) => {
    if (!acc[p.group]) acc[p.group] = []
    acc[p.group].push(p)
    return acc
  },
  {}
)

export default function ProcedureCard({ index, procedure, onChange, onRemove, canRemove }: Props) {
  const isIntubation  = INTUBATION_TYPES.includes(procedure.type as typeof INTUBATION_TYPES[number])
  const isNerveBlock  = procedure.type === 'bloqueio_periferico'
  const isNeuroaxial  = procedure.type === 'raquidiana' || procedure.type === 'peridural'

  function set<K extends keyof ProcedureInput>(key: K, value: ProcedureInput[K]) {
    onChange({ ...procedure, [key]: value })
  }

  function handleTypeChange(type: string) {
    onChange({
      ...procedure,
      type,
      is_difficult_airway: false,
      attempts: null,
      patient_position: null,
      nerve_block_type: undefined,
      nerve_block_pain: null,
    })
  }

  return (
    <div className="rounded-xl border border-gray-700 bg-gray-800/60 overflow-hidden">
      {/* Header do card */}
      <div className="flex items-center justify-between border-b border-gray-700 bg-gray-800 px-4 py-3">
        <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">
          Procedimento {index + 1}
        </span>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="rounded-lg p-1.5 text-slate-600 hover:bg-red-500/10 hover:text-red-400 transition-colors"
            title="Remover procedimento"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

      <div className="flex flex-col gap-4 p-4">
        {/* Tipo do procedimento */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-slate-400">Tipo de procedimento</label>
          <div className="relative">
            <select
              value={procedure.type}
              onChange={(e) => handleTypeChange(e.target.value)}
              className="w-full appearance-none rounded-lg border border-gray-600 bg-gray-900
                         px-4 py-2.5 pr-10 text-sm text-slate-100 outline-none
                         focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 cursor-pointer"
            >
              <option value="" disabled className="bg-gray-900">Selecione...</option>
              {Object.entries(PROC_GROUPS).map(([group, items]) => (
                <optgroup key={group} label={group} className="bg-gray-900 text-slate-400">
                  {items.map((p) => (
                    <option key={p.value} value={p.value} className="bg-gray-900 text-slate-100">
                      {p.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
          </div>
        </div>

        {/* Status: Sucesso / Falha */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-slate-400">Status</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => set('status', 'success')}
              className={[
                'flex items-center justify-center gap-2 rounded-lg border py-2.5 text-sm font-medium transition-all',
                procedure.status === 'success'
                  ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-400'
                  : 'border-gray-600 bg-gray-900 text-slate-500 hover:border-gray-500 hover:text-slate-300',
              ].join(' ')}
            >
              <CheckCircle2 size={15} />
              Sucesso
            </button>
            <button
              type="button"
              onClick={() => set('status', 'failure')}
              className={[
                'flex items-center justify-center gap-2 rounded-lg border py-2.5 text-sm font-medium transition-all',
                procedure.status === 'failure'
                  ? 'border-red-500/50 bg-red-500/15 text-red-400'
                  : 'border-gray-600 bg-gray-900 text-slate-500 hover:border-gray-500 hover:text-slate-300',
              ].join(' ')}
            >
              <XCircle size={15} />
              Falha
            </button>
          </div>
        </div>

        {/* Campos específicos de neuroeixo (raqui / peridural) */}
        {isNeuroaxial && (
          <div className="flex flex-col gap-3 rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-3">
            <span className="text-xs font-semibold uppercase tracking-widest text-cyan-400">
              Detalhes do Neuroeixo
            </span>

            {/* Posição do paciente */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-400">Posição do paciente</label>
              <div className="grid grid-cols-2 gap-2">
                {([
                  { value: 'sentado',          label: 'Sentado' },
                  { value: 'decubito_lateral', label: 'Decúbito Lateral' },
                ] as const).map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => set('patient_position', opt.value)}
                    className={[
                      'rounded-lg border py-2.5 text-sm font-medium transition-all',
                      procedure.patient_position === opt.value
                        ? 'border-cyan-500/50 bg-cyan-500/15 text-cyan-400'
                        : 'border-gray-600 bg-gray-900 text-slate-500 hover:border-gray-500 hover:text-slate-300',
                    ].join(' ')}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Número de tentativas */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-400">Número de tentativas</label>
              <input
                type="number"
                min={1}
                value={procedure.attempts ?? 1}
                onChange={(e) => {
                  const n = parseInt(e.target.value, 10)
                  set('attempts', isNaN(n) || n < 1 ? 1 : n)
                }}
                className="w-full rounded-lg border border-gray-600 bg-gray-900 px-4 py-2.5
                           text-sm text-slate-100 outline-none
                           focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
              />
            </div>
          </div>
        )}

        {/* Via aérea difícil (só se intubação) */}
        {isIntubation && (
          <button
            type="button"
            onClick={() => set('is_difficult_airway', !procedure.is_difficult_airway)}
            className={[
              'flex items-center gap-3 rounded-lg border p-3 text-left transition-all',
              procedure.is_difficult_airway
                ? 'border-orange-500/40 bg-orange-500/10'
                : 'border-gray-600 bg-gray-900 hover:border-gray-500',
            ].join(' ')}
          >
            {/* Checkbox visual */}
            <span
              className={[
                'flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border transition-colors',
                procedure.is_difficult_airway
                  ? 'border-orange-500 bg-orange-500'
                  : 'border-gray-600 bg-gray-800',
              ].join(' ')}
            >
              {procedure.is_difficult_airway && (
                <svg viewBox="0 0 10 8" className="h-2.5 w-2.5 fill-white">
                  <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </span>
            <div className="flex items-center gap-2">
              <Wind size={14} className={procedure.is_difficult_airway ? 'text-orange-400' : 'text-slate-500'} />
              <span className={`text-sm font-medium ${procedure.is_difficult_airway ? 'text-orange-300' : 'text-slate-400'}`}>
                Via aérea difícil
              </span>
            </div>
          </button>
        )}

        {/* Bloqueio periférico */}
        {isNerveBlock && (
          <div className="flex flex-col gap-3 rounded-lg border border-violet-500/20 bg-violet-500/5 p-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-violet-400">
              <Activity size={12} />
              Detalhes do Bloqueio
            </div>

            {/* Tipo de bloqueio */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-400">Tipo de bloqueio</label>
              <div className="relative">
                <select
                  value={procedure.nerve_block_type ?? ''}
                  onChange={(e) => set('nerve_block_type', e.target.value)}
                  className="w-full appearance-none rounded-lg border border-gray-600 bg-gray-900
                             px-4 py-2.5 pr-10 text-sm text-slate-100 outline-none
                             focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 cursor-pointer"
                >
                  <option value="" className="bg-gray-900">Selecione o bloqueio...</option>
                  {NERVE_BLOCK_GROUPS.map((group) => (
                    <optgroup key={group.region} label={group.region} className="bg-gray-900 text-slate-400">
                      {group.items.map((b) => (
                        <option key={b} value={b} className="bg-gray-900 text-slate-100">{b}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
              </div>
            </div>

            {/* Toggle de dor pós-op */}
            <button
              type="button"
              onClick={() => set('nerve_block_pain', procedure.nerve_block_pain == null ? 0 : null)}
              className={[
                'flex items-center gap-3 rounded-lg border p-3 text-left transition-all',
                procedure.nerve_block_pain != null
                  ? 'border-violet-500/40 bg-violet-500/10'
                  : 'border-gray-600 bg-gray-900 hover:border-gray-500',
              ].join(' ')}
            >
              <div className={[
                'relative h-5 w-9 flex-shrink-0 rounded-full transition-colors',
                procedure.nerve_block_pain != null ? 'bg-violet-500' : 'bg-gray-600',
              ].join(' ')}>
                <span className={[
                  'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform',
                  procedure.nerve_block_pain != null ? 'translate-x-4' : 'translate-x-0.5',
                ].join(' ')} />
              </div>
              <span className={`text-xs font-medium ${procedure.nerve_block_pain != null ? 'text-violet-300' : 'text-slate-500'}`}>
                Avaliei dor no pós-operatório
              </span>
            </button>

            {/* Nível de dor — só aparece quando toggle ativo */}
            {procedure.nerve_block_pain != null && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-slate-400">Intensidade da dor</label>
                  <span className={[
                    'rounded-full px-2 py-0.5 text-xs font-bold',
                    procedure.nerve_block_pain <= 3
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : procedure.nerve_block_pain <= 6
                      ? 'bg-yellow-500/20 text-yellow-400'
                      : 'bg-red-500/20 text-red-400',
                  ].join(' ')}>
                    {['Nenhuma','','','Fraca','','','Moderada','','','Forte','Intensa'][procedure.nerve_block_pain]}
                    {' '}({procedure.nerve_block_pain}/10)
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: 'Nenhuma', value: 0,  color: 'emerald' },
                    { label: 'Fraca',   value: 3,  color: 'emerald' },
                    { label: 'Moderada',value: 6,  color: 'yellow'  },
                    { label: 'Forte',   value: 9,  color: 'red'     },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => set('nerve_block_pain', opt.value)}
                      className={[
                        'rounded-lg border py-2 text-xs font-medium transition-all',
                        procedure.nerve_block_pain === opt.value
                          ? opt.color === 'emerald' ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-400'
                          : opt.color === 'yellow'  ? 'border-yellow-500/50 bg-yellow-500/15 text-yellow-400'
                          : 'border-red-500/50 bg-red-500/15 text-red-400'
                          : 'border-gray-600 bg-gray-900 text-slate-500 hover:border-gray-500',
                      ].join(' ')}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Observações do procedimento */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-slate-400">
            Observações <span className="text-slate-600">(opcional)</span>
          </label>
          <textarea
            value={procedure.notes}
            onChange={(e) => set('notes', e.target.value)}
            rows={2}
            placeholder="Detalhes técnicos, dificuldades, aprendizados..."
            className="w-full resize-none rounded-lg border border-gray-600 bg-gray-900 px-4 py-2.5
                       text-sm text-slate-100 placeholder:text-slate-600 outline-none
                       focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
          />
        </div>
      </div>
    </div>
  )
}

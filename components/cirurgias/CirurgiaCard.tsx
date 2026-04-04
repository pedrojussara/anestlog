import Link from 'next/link'
import { Calendar, Pencil, CheckCircle2, XCircle, Wind, Activity } from 'lucide-react'
import type { SurgeryRow } from '@/lib/surgeries'
import { getProcedureLabel, formatDateLong } from '@/lib/surgeries'
import { ANESTHESIA_LABELS } from '@/lib/anesthesia'
import type { AnesthesiaType } from '@/types'
import DeleteSurgeryButton from './DeleteSurgeryButton'

interface Props {
  surgery: SurgeryRow
}

export default function CirurgiaCard({ surgery }: Props) {
  const successCount = surgery.procedures.filter((p) => p.status === 'success').length
  const failureCount = surgery.procedures.filter((p) => p.status === 'failure').length
  const hasDifficultAirway = surgery.procedures.some((p) => p.is_difficult_airway)

  const allSuccess = failureCount === 0 && successCount > 0
  const hasFailure = failureCount > 0

  return (
    <div className={[
      'group flex flex-col rounded-2xl border bg-gray-800 overflow-hidden',
      'transition-all hover:border-gray-600 hover:shadow-lg hover:shadow-black/20',
      hasFailure ? 'border-red-500/20' : 'border-gray-700',
    ].join(' ')}>

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-gray-700/60">
        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex items-center gap-2">
            {/* Indicador de status geral */}
            <span className={[
              'h-2 w-2 rounded-full flex-shrink-0',
              allSuccess ? 'bg-emerald-500' : hasFailure ? 'bg-red-500' : 'bg-slate-600',
            ].join(' ')} />
            <h3 className="font-semibold text-slate-100 truncate">{surgery.specialty}</h3>
          </div>
          {surgery.surgery_name && (
            <p className="text-sm text-slate-400 truncate">{surgery.surgery_name}</p>
          )}
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Calendar size={11} />
            <span className="capitalize">{formatDateLong(surgery.date)}</span>
          </div>
        </div>

        {/* Ações */}
        <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <Link
            href={`/dashboard/cirurgias/${surgery.id}/editar`}
            className="rounded-lg p-1.5 text-slate-600 hover:bg-gray-700 hover:text-slate-300 transition-colors"
            title="Editar cirurgia"
          >
            <Pencil size={15} />
          </Link>
          <DeleteSurgeryButton surgeryId={surgery.id} />
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex flex-col gap-3 p-5">
        {/* Tipos de anestesia */}
        <div className="flex flex-wrap gap-1.5">
          {surgery.anesthesia_types.map((type) => (
            <span
              key={type}
              className="rounded-full border border-cyan-500/20 bg-cyan-500/10
                         px-2.5 py-0.5 text-xs font-medium text-cyan-300"
            >
              {ANESTHESIA_LABELS[type as AnesthesiaType] ?? type}
            </span>
          ))}
        </div>

        {/* Alerta via aérea difícil */}
        {hasDifficultAirway && (
          <div className="flex items-center gap-1.5 text-xs text-orange-400">
            <Wind size={12} />
            <span>Via aérea difícil</span>
          </div>
        )}

        {/* Procedimentos */}
        <div className="flex flex-col gap-1.5">
          {surgery.procedures.map((proc) => (
            <div key={proc.id} className="flex items-center gap-2">
              {proc.status === 'success' ? (
                <CheckCircle2 size={13} className="flex-shrink-0 text-emerald-500" />
              ) : (
                <XCircle size={13} className="flex-shrink-0 text-red-500" />
              )}
              <span className="text-xs text-slate-300">
                {getProcedureLabel(proc.type)}
                {(proc.type === 'raquidiana' || proc.type === 'peridural') && (
                  <span className="ml-1 text-slate-500">
                    {proc.attempts != null && proc.attempts > 0 && (
                      <> · {proc.attempts} {proc.attempts === 1 ? 'tentativa' : 'tentativas'}</>
                    )}
                    {proc.patient_position === 'sentado' && ' · Sentado'}
                    {proc.patient_position === 'decubito_lateral' && ' · Decúbito Lateral'}
                  </span>
                )}
              </span>
              {proc.type === 'bloqueio_periferico' && (
                <Activity size={11} className="flex-shrink-0 text-violet-400" />
              )}
              {proc.is_difficult_airway && (
                <Wind size={11} className="flex-shrink-0 text-orange-400" />
              )}
            </div>
          ))}
        </div>

        {/* Observações */}
        {surgery.notes && (
          <p className="line-clamp-2 text-xs italic text-slate-500 border-t border-gray-700/60 pt-3">
            {surgery.notes}
          </p>
        )}
      </div>

      {/* ── Footer com contadores ── */}
      <div className="flex items-center gap-4 border-t border-gray-700/60 bg-gray-900/40 px-5 py-3">
        <div className="flex items-center gap-1.5 text-xs text-emerald-400">
          <CheckCircle2 size={12} />
          <span>{successCount} sucesso{successCount !== 1 ? 's' : ''}</span>
        </div>
        {failureCount > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-red-400">
            <XCircle size={12} />
            <span>{failureCount} falha{failureCount !== 1 ? 's' : ''}</span>
          </div>
        )}
        <span className="ml-auto text-xs text-slate-600">
          {surgery.procedures.length} procedimento{surgery.procedures.length !== 1 ? 's' : ''}
        </span>
      </div>
    </div>
  )
}

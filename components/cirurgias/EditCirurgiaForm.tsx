'use client'

import { useState, useTransition } from 'react'
import { Plus, Save, Calendar, FileText, Stethoscope, AlertCircle, Tag } from 'lucide-react'
import { updateSurgery, type ProcedureInput } from '@/app/actions/surgeries'
import type { AnesthesiaType } from '@/types'
import Button from '@/components/ui/Button'
import ProcedureCard from './ProcedureCard'
import AnesthesiaMultiSelect from './AnesthesiaMultiSelect'
import SpecialtySelect from './SpecialtySelect'

function todayISODate() {
  return new Date().toISOString().split('T')[0]
}

interface InitialData {
  date: string
  specialty: string
  surgery_name: string | null
  anesthesia_types: AnesthesiaType[]
  notes: string | null
  procedures: ProcedureInput[]
}

interface Props {
  surgeryId: string
  initialData: InitialData
}

export default function EditCirurgiaForm({ surgeryId, initialData }: Props) {
  const [date, setDate] = useState(initialData.date)
  const [specialty, setSpecialty] = useState(initialData.specialty)
  const [surgeryName, setSurgeryName] = useState(initialData.surgery_name ?? '')
  const [anesthesiaTypes, setAnesthesiaTypes] = useState<AnesthesiaType[]>(initialData.anesthesia_types)
  const [procedures, setProcedures] = useState<ProcedureInput[]>(initialData.procedures)
  const [notes, setNotes] = useState(initialData.notes ?? '')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function addProcedure() {
    setProcedures((prev) => [...prev, {
      type: 'intubacao_orotraqueal',
      status: 'success',
      is_difficult_airway: false,
      notes: '',
      nerve_block_type: undefined,
      nerve_block_pain: null,
    }])
  }

  function updateProcedure(index: number, updated: ProcedureInput) {
    setProcedures((prev) => prev.map((p, i) => (i === index ? updated : p)))
  }

  function removeProcedure(index: number) {
    setProcedures((prev) => prev.filter((_, i) => i !== index))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!specialty) { setError('Selecione a especialidade.'); return }
    if (anesthesiaTypes.length === 0) { setError('Selecione ao menos um tipo de anestesia.'); return }
    const invalidProc = procedures.find((p) => !p.type)
    if (invalidProc) { setError('Selecione o tipo de todos os procedimentos.'); return }

    startTransition(async () => {
      const result = await updateSurgery(surgeryId, {
        date,
        specialty,
        surgery_name: surgeryName,
        anesthesia_types: anesthesiaTypes,
        notes,
        procedures,
      })
      if (result?.error) setError(result.error)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">

      {/* ── Seção 1: Dados da cirurgia ── */}
      <section className="rounded-2xl border border-gray-700 bg-gray-800 overflow-hidden">
        <div className="flex items-center gap-2 border-b border-gray-700 bg-gray-800/80 px-5 py-4">
          <Stethoscope size={15} className="text-cyan-400" />
          <h2 className="text-sm font-semibold text-slate-200">Dados da Cirurgia</h2>
        </div>

        <div className="flex flex-col gap-4 p-5">
          {/* Data */}
          <div className="flex flex-col gap-1.5">
            <label className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
              <Calendar size={12} />
              Data da cirurgia
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              max={todayISODate()}
              required
              className="w-full rounded-lg border border-gray-600 bg-gray-900 px-4 py-2.5
                         text-sm text-slate-100 outline-none cursor-pointer
                         focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20
                         [color-scheme:dark]"
            />
          </div>

          {/* Especialidade */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-400">Especialidade cirúrgica</label>
            <SpecialtySelect value={specialty} onChange={setSpecialty} />
          </div>

          {/* Nome da cirurgia */}
          <div className="flex flex-col gap-1.5">
            <label className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
              <Tag size={12} />
              Nome da cirurgia
              <span className="text-slate-600">(opcional)</span>
            </label>
            <input
              type="text"
              value={surgeryName}
              onChange={(e) => setSurgeryName(e.target.value)}
              placeholder="Ex: Artroplastia de quadril, Colecistectomia..."
              className="w-full rounded-lg border border-gray-600 bg-gray-900 px-4 py-2.5
                         text-sm text-slate-100 placeholder:text-slate-600 outline-none
                         focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
            />
          </div>
        </div>
      </section>

      {/* ── Seção 2: Tipos de anestesia ── */}
      <section className="rounded-2xl border border-gray-700 bg-gray-800 overflow-hidden">
        <div className="flex items-center gap-2 border-b border-gray-700 bg-gray-800/80 px-5 py-4">
          <div className="h-3 w-3 rounded-full bg-cyan-400" />
          <h2 className="text-sm font-semibold text-slate-200">Tipos de Anestesia</h2>
          {anesthesiaTypes.length > 0 && (
            <span className="ml-auto rounded-full bg-cyan-500/20 px-2 py-0.5 text-xs font-semibold text-cyan-400">
              {anesthesiaTypes.length} selecionado{anesthesiaTypes.length > 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className="p-5">
          <AnesthesiaMultiSelect
            selected={anesthesiaTypes}
            onChange={setAnesthesiaTypes}
          />
          {anesthesiaTypes.length === 0 && (
            <p className="mt-2 text-xs text-slate-600">Selecione um ou mais tipos utilizados</p>
          )}
        </div>
      </section>

      {/* ── Seção 3: Procedimentos ── */}
      <section className="rounded-2xl border border-gray-700 bg-gray-800 overflow-hidden">
        <div className="flex items-center gap-2 border-b border-gray-700 bg-gray-800/80 px-5 py-4">
          <div className="h-3 w-3 rounded-full bg-violet-400" />
          <h2 className="text-sm font-semibold text-slate-200">Procedimentos</h2>
          <span className="ml-auto rounded-full bg-gray-700 px-2 py-0.5 text-xs text-slate-400">
            {procedures.length}
          </span>
        </div>

        <div className="flex flex-col gap-3 p-5">
          {procedures.map((proc, i) => (
            <ProcedureCard
              key={i}
              index={i}
              procedure={proc}
              onChange={(updated) => updateProcedure(i, updated)}
              onRemove={() => removeProcedure(i)}
              canRemove={procedures.length > 1}
            />
          ))}

          <button
            type="button"
            onClick={addProcedure}
            className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl border
                       border-dashed border-gray-600 py-3 text-sm text-slate-500
                       hover:border-cyan-500/40 hover:bg-cyan-500/5 hover:text-cyan-400
                       transition-all"
          >
            <Plus size={15} />
            Adicionar procedimento
          </button>
        </div>
      </section>

      {/* ── Seção 4: Observações gerais ── */}
      <section className="rounded-2xl border border-gray-700 bg-gray-800 overflow-hidden">
        <div className="flex items-center gap-2 border-b border-gray-700 bg-gray-800/80 px-5 py-4">
          <FileText size={15} className="text-slate-500" />
          <h2 className="text-sm font-semibold text-slate-200">
            Observações Gerais{' '}
            <span className="text-xs font-normal text-slate-600">(opcional)</span>
          </h2>
        </div>
        <div className="p-5">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Intercorrências, aprendizados, contexto clínico relevante..."
            className="w-full resize-none rounded-lg border border-gray-600 bg-gray-900 px-4 py-3
                       text-sm text-slate-100 placeholder:text-slate-600 outline-none
                       focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
          />
        </div>
      </section>

      {/* ── Erro global ── */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3">
          <AlertCircle size={15} className="mt-0.5 flex-shrink-0 text-red-400" />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* ── Botões ── */}
      <div className="flex flex-col gap-2 pb-8 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="ghost"
          onClick={() => window.history.back()}
        >
          Cancelar
        </Button>
        <Button type="submit" loading={isPending}>
          <Save size={15} />
          Salvar alterações
        </Button>
      </div>
    </form>
  )
}

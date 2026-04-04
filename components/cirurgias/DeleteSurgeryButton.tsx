'use client'

import { useState, useTransition } from 'react'
import { Trash2, AlertTriangle } from 'lucide-react'
import { deleteSurgery } from '@/app/actions/surgeries'

export default function DeleteSurgeryButton({ surgeryId }: { surgeryId: string }) {
  const [confirming, setConfirming] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    startTransition(async () => {
      await deleteSurgery(surgeryId)
      setConfirming(false)
    })
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-1.5 rounded-lg border border-red-500/40 bg-red-500/10 px-2.5 py-1.5">
        <AlertTriangle size={12} className="flex-shrink-0 text-red-400" />
        <span className="text-xs text-red-300">Deletar?</span>
        <button
          onClick={handleDelete}
          disabled={isPending}
          className="rounded px-1.5 py-0.5 text-xs font-semibold text-red-400
                     hover:bg-red-500/20 transition-colors disabled:opacity-50"
        >
          {isPending ? '...' : 'Sim'}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="rounded px-1.5 py-0.5 text-xs text-slate-500 hover:text-slate-300 transition-colors"
        >
          Não
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="rounded-lg p-1.5 text-slate-600 hover:bg-red-500/10 hover:text-red-400 transition-colors"
      title="Deletar cirurgia"
    >
      <Trash2 size={15} />
    </button>
  )
}

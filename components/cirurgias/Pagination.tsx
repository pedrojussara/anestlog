'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { PAGE_SIZE } from '@/lib/surgeries'

interface Props {
  total: number
  currentPage: number
}

export default function Pagination({ total, currentPage }: Props) {
  const router = useRouter()
  const params = useSearchParams()
  const totalPages = Math.ceil(total / PAGE_SIZE)

  if (totalPages <= 1) return null

  function goTo(page: number) {
    const next = new URLSearchParams(params.toString())
    next.set('page', String(page))
    router.push(`/dashboard/cirurgias?${next.toString()}`)
  }

  // Gera array de páginas visíveis (max 5 ao redor da atual)
  const pages: (number | '…')[] = []
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || Math.abs(i - currentPage) <= 1) {
      pages.push(i)
    } else if (pages[pages.length - 1] !== '…') {
      pages.push('…')
    }
  }

  return (
    <div className="flex items-center justify-center gap-1 py-4">
      <button
        onClick={() => goTo(currentPage - 1)}
        disabled={currentPage === 1}
        className="rounded-lg p-2 text-slate-500 hover:bg-gray-800 hover:text-slate-300
                   disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeft size={16} />
      </button>

      {pages.map((p, i) =>
        p === '…' ? (
          <span key={`ellipsis-${i}`} className="px-1 text-slate-600 text-sm">…</span>
        ) : (
          <button
            key={p}
            onClick={() => goTo(p as number)}
            className={[
              'min-w-[36px] rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
              p === currentPage
                ? 'bg-cyan-500 text-gray-900'
                : 'text-slate-400 hover:bg-gray-800 hover:text-slate-200',
            ].join(' ')}
          >
            {p}
          </button>
        )
      )}

      <button
        onClick={() => goTo(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="rounded-lg p-2 text-slate-500 hover:bg-gray-800 hover:text-slate-300
                   disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  )
}

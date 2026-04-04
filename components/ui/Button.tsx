'use client'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean
  variant?: 'primary' | 'ghost'
  fullWidth?: boolean
}

export default function Button({
  children,
  loading = false,
  variant = 'primary',
  fullWidth = false,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed'

  const variants = {
    primary:
      'bg-cyan-500 text-slate-900 hover:bg-cyan-400 focus:ring-cyan-500 active:scale-[0.98]',
    ghost:
      'bg-transparent text-slate-300 border border-slate-700 hover:bg-slate-800 focus:ring-slate-500',
  }

  return (
    <button
      disabled={disabled || loading}
      className={[base, variants[variant], fullWidth ? 'w-full' : '', className].join(' ')}
      {...props}
    >
      {loading ? (
        <>
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          Aguarde...
        </>
      ) : (
        children
      )}
    </button>
  )
}

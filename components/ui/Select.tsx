import { forwardRef } from 'react'

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  error?: string
  options: { value: string; label: string }[]
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, className = '', ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-slate-300">{label}</label>
        <select
          ref={ref}
          className={[
            'w-full rounded-lg border bg-slate-800/60 px-4 py-2.5 text-sm text-slate-100',
            'outline-none transition-all appearance-none cursor-pointer',
            'border-slate-700 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20',
            error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : '',
            className,
          ].join(' ')}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-slate-800">
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    )
  }
)

Select.displayName = 'Select'
export default Select

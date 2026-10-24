// A labelled text input. The label is wired to the input so screen readers (and tests) can find it.
import { useId } from 'react'
import type { InputHTMLAttributes } from 'react'

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
}

export function FormField({ label, className = '', ...inputProps }: FormFieldProps) {
  const id = useId()
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-neutral-300">
        {label}
      </label>
      <input
        id={id}
        className="h-10 w-full rounded-lg border border-line bg-base px-3 text-sm text-white placeholder:text-neutral-500 outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/25"
        {...inputProps}
      />
    </div>
  )
}

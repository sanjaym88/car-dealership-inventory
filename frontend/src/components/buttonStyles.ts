// One button language for the whole app, inspired by rivian.com: calm, solid pills with
// medium-weight type and a slow, symmetric ease on colour changes. Works on <button> and <Link>.

export type ButtonVariant = 'solid' | 'light' | 'outline' | 'ghost' | 'success' | 'danger'
export type ButtonSize = 'lg' | 'md' | 'sm'

const BASE =
  'inline-flex items-center justify-center gap-2 rounded-full font-medium tracking-[-0.01em] whitespace-nowrap ' +
  'transition-[background-color,color,box-shadow,transform] duration-300 ease-glide ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-rose-400 ' +
  'active:scale-[0.98] disabled:cursor-not-allowed disabled:active:scale-100'

const VARIANTS: Record<ButtonVariant, string> = {
  // dark pill: the primary action on light surfaces
  solid: 'bg-neutral-950 text-white hover:bg-neutral-800 disabled:bg-neutral-300 disabled:text-neutral-500',
  // light pill: the primary action on dark surfaces
  light: 'bg-white text-neutral-950 hover:bg-neutral-200 disabled:bg-neutral-500',
  // quiet secondary action on dark surfaces
  outline: 'bg-neutral-950 text-white ring-1 ring-inset ring-neutral-500 hover:bg-white hover:text-neutral-950 hover:ring-white',
  // text-like action on light surfaces
  ghost: 'text-neutral-700 hover:bg-neutral-100',
  success: 'bg-emerald-600 text-white hover:bg-emerald-500 disabled:bg-neutral-200 disabled:text-neutral-500',
  danger: 'bg-rose-600 text-white hover:bg-rose-500 disabled:bg-rose-300',
}

const SIZES: Record<ButtonSize, string> = {
  lg: 'h-14 px-7 text-[15px]',
  md: 'h-11 px-5 text-sm',
  sm: 'h-9 px-4 text-sm',
}

export function buttonClass({ variant = 'solid', size = 'md', block = false }: {
  variant?: ButtonVariant
  size?: ButtonSize
  block?: boolean
} = {}): string {
  return [BASE, VARIANTS[variant], SIZES[size], block ? 'w-full' : ''].filter(Boolean).join(' ')
}

// One button language for the whole app, in the style of Watermelon UI: compact rounded buttons
// on dark surfaces, with the lime accent for the primary action. Works on <button> and <Link>.

export type ButtonVariant = 'solid' | 'light' | 'outline' | 'ghost' | 'success' | 'danger'
export type ButtonSize = 'lg' | 'md' | 'sm'

const BASE =
  'inline-flex items-center justify-center gap-2 rounded-full font-medium whitespace-nowrap ' +
  'transition-[background-color,color,box-shadow,transform] duration-300 ease-glide ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-base focus-visible:ring-accent ' +
  'active:scale-[0.98] disabled:cursor-not-allowed disabled:active:scale-100'

const VARIANTS: Record<ButtonVariant, string> = {
  // lime pill: the primary action
  solid: 'bg-accent text-black hover:bg-accent-strong disabled:bg-panel-2 disabled:text-muted',
  // white pill: the primary action over photos or video
  light: 'bg-white text-black hover:bg-neutral-200 disabled:bg-neutral-500',
  // quiet secondary action
  outline: 'bg-panel text-white ring-1 ring-inset ring-line hover:bg-panel-2',
  // text-like action
  ghost: 'text-muted hover:bg-panel-2 hover:text-white',
  success: 'bg-emerald-500 text-black hover:bg-emerald-400 disabled:bg-panel-2 disabled:text-muted',
  danger: 'bg-rose-600 text-white hover:bg-rose-500 disabled:bg-rose-900',
}

const SIZES: Record<ButtonSize, string> = {
  lg: 'h-12 px-6 text-[15px]',
  md: 'h-10 px-4 text-sm',
  sm: 'h-9 px-3.5 text-sm',
}

export function buttonClass({ variant = 'solid', size = 'md', block = false }: {
  variant?: ButtonVariant
  size?: ButtonSize
  block?: boolean
} = {}): string {
  return [BASE, VARIANTS[variant], SIZES[size], block ? 'w-full' : ''].filter(Boolean).join(' ')
}

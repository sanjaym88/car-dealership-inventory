// Search/filter form for the inventory. Hands the parent only the filters the user filled in.
import { useId, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { ChevronDown, SlidersHorizontal } from 'lucide-react'
import type { VehicleSearchParams } from '../api/types'
import { ErrorMessage } from './ErrorMessage'
import { FormField } from './FormField'
import { buttonClass } from './buttonStyles'

const EMPTY = { make: '', model: '', category: '', minPrice: '', maxPrice: '' }

function toParams(fields: typeof EMPTY): VehicleSearchParams {
  const params: VehicleSearchParams = {}
  if (fields.make.trim()) params.make = fields.make.trim()
  if (fields.model.trim()) params.model = fields.model.trim()
  if (fields.category) params.category = fields.category
  if (fields.minPrice !== '') params.min_price = Number(fields.minPrice)
  if (fields.maxPrice !== '') params.max_price = Number(fields.maxPrice)
  return params
}

export function SearchBar({ categories, onSearch, onClear }: {
  categories: string[]
  onSearch: (params: VehicleSearchParams) => void
  onClear: () => void
}) {
  const [fields, setFields] = useState(EMPTY)
  const [error, setError] = useState<string | null>(null)
  const categoryId = useId()

  const update = (name: keyof typeof EMPTY) => (event: { target: { value: string } }) =>
    setFields((current) => ({ ...current, [name]: event.target.value }))

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const params = toParams(fields)
    if (params.min_price !== undefined && params.max_price !== undefined && params.min_price > params.max_price) {
      setError("Min price can't be higher than max price.")
      return
    }
    setError(null)
    onSearch(params)
  }

  function handleClear() {
    setFields(EMPTY)
    setError(null)
    onClear()
  }

  return (
    <form onSubmit={handleSubmit} role="search" className="rounded-2xl border border-line bg-panel p-5">
      <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
        <SlidersHorizontal aria-hidden="true" className="h-4 w-4 text-muted" />
        Filters
      </div>
      <FilterSection title="Vehicle">
        <FormField label="Make" placeholder="e.g. Toyota" value={fields.make} onChange={update('make')} />
        <FormField label="Model" placeholder="e.g. Camry" value={fields.model} onChange={update('model')} />
        <div>
          <label htmlFor={categoryId} className="mb-1.5 block text-sm font-medium text-neutral-300">Category</label>
          <select id={categoryId} value={fields.category} onChange={update('category')}
            className="h-10 w-full rounded-lg border border-line bg-base px-3 text-sm text-white outline-none focus:border-accent focus:ring-2 focus:ring-accent/25">
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>
      </FilterSection>
      <FilterSection title="Price">
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Min price" type="number" min={0} step="any" placeholder="$"
            value={fields.minPrice} onChange={update('minPrice')} />
          <FormField label="Max price" type="number" min={0} step="any" placeholder="$"
            value={fields.maxPrice} onChange={update('maxPrice')} />
        </div>
      </FilterSection>
      <div className="mt-5 space-y-3">
        <ErrorMessage message={error} />
        <div className="flex gap-2">
          <button type="submit" className={`${buttonClass({ variant: 'solid', size: 'sm' })} flex-1`}>
            Search
          </button>
          <button type="button" onClick={handleClear} className={buttonClass({ variant: 'ghost', size: 'sm' })}>
            Clear
          </button>
        </div>
      </div>
    </form>
  )
}

// A titled group of filters that opens and closes, like Watermelon UI's collapsible filter panels.
function FilterSection({ title, children }: { title: string; children: ReactNode }) {
  const [open, setOpen] = useState(true)
  const contentId = useId()
  return (
    <div className="border-t border-line py-3">
      <button type="button" aria-expanded={open} aria-controls={contentId} onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-1 text-sm font-medium text-white">
        {title}
        <ChevronDown aria-hidden="true"
          className={`h-4 w-4 text-muted transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div id={contentId} className="mt-3 space-y-3">{children}</div>}
    </div>
  )
}

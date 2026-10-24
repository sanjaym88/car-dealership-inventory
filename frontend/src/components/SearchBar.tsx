// Search/filter form for the inventory. Hands the parent only the filters the user filled in.
import { useId, useState } from 'react'
import type { FormEvent } from 'react'
import type { VehicleSearchParams } from '../api/types'
import { ErrorMessage } from './ErrorMessage'
import { FormField } from './FormField'

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
    <form onSubmit={handleSubmit} role="search"
      className="mb-6 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <FormField label="Make" placeholder="e.g. Toyota" value={fields.make} onChange={update('make')} />
        <FormField label="Model" placeholder="e.g. Camry" value={fields.model} onChange={update('model')} />
        <div>
          <label htmlFor={categoryId} className="mb-1 block text-sm font-medium text-slate-700">Category</label>
          <select id={categoryId} value={fields.category} onChange={update('category')}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200">
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>
        <FormField label="Min price" type="number" min={0} step="any" placeholder="$"
          value={fields.minPrice} onChange={update('minPrice')} />
        <FormField label="Max price" type="number" min={0} step="any" placeholder="$"
          value={fields.maxPrice} onChange={update('maxPrice')} />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button type="submit"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-indigo-500">
          Search
        </button>
        <button type="button" onClick={handleClear}
          className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100">
          Clear
        </button>
        <div className="grow"><ErrorMessage message={error} /></div>
      </div>
    </form>
  )
}

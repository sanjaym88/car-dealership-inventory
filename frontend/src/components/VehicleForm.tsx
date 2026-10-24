// Add/edit form for a vehicle. Validates locally with the same rules as the API before submitting.
import { useState } from 'react'
import type { FormEvent } from 'react'
import type { VehicleInput } from '../api/types'
import { ErrorMessage } from './ErrorMessage'
import { FormActions } from './FormActions'
import { FormField } from './FormField'
import { usePendingSubmit } from './usePendingSubmit'

type Fields = Record<keyof VehicleInput, string>

const toFields = (v?: VehicleInput): Fields => ({
  make: v?.make ?? '',
  model: v?.model ?? '',
  category: v?.category ?? '',
  price: v ? String(v.price) : '',
  quantity: v ? String(v.quantity) : '',
  image_url: v?.image_url ?? '',
})

// Same rule as the API: plain web links only, so nothing like javascript: reaches <img src>.
const WEB_URL = /^https?:\/\/\S+$/

/** Returns the cleaned vehicle, or an error message for the first invalid field. */
function validate(fields: Fields): VehicleInput | string {
  const make = fields.make.trim()
  const model = fields.model.trim()
  const category = fields.category.trim()
  const price = Number(fields.price)
  const quantity = Number(fields.quantity)
  if (!make) return 'Make is required.'
  if (!model) return 'Model is required.'
  if (!category) return 'Category is required.'
  if (fields.price.trim() === '' || !(price > 0)) return 'Price must be greater than 0.'
  if (fields.quantity.trim() === '' || !Number.isInteger(quantity) || quantity < 0) {
    return 'Quantity must be a whole number of 0 or more.'
  }
  const imageUrl = fields.image_url.trim()
  if (imageUrl && !WEB_URL.test(imageUrl)) return 'Photo URL must start with http:// or https://'
  return { make, model, category, price, quantity, ...(imageUrl && { image_url: imageUrl }) }
}

export function VehicleForm({ initial, submitLabel, onSubmit, onCancel }: {
  initial?: VehicleInput
  submitLabel: string
  onSubmit: (vehicle: VehicleInput) => Promise<void>
  onCancel: () => void
}) {
  const [fields, setFields] = useState(() => toFields(initial))
  const { pending, error, setError, run } = usePendingSubmit()

  const update = (name: keyof Fields) => (event: { target: { value: string } }) =>
    setFields((current) => ({ ...current, [name]: event.target.value }))

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const result = validate(fields)
    if (typeof result === 'string') {
      setError(result)
      return
    }
    void run(() => onSubmit(result))
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Make" value={fields.make} onChange={update('make')} autoFocus />
        <FormField label="Model" value={fields.model} onChange={update('model')} />
      </div>
      <FormField label="Category" placeholder="e.g. Sedan, SUV" value={fields.category} onChange={update('category')} />
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Price (USD)" type="number" min={0} step="any" value={fields.price} onChange={update('price')} />
        <FormField label="Quantity in stock" type="number" min={0} step={1} value={fields.quantity} onChange={update('quantity')} />
      </div>
      <FormField label="Photo URL (optional)" type="url" placeholder="https://…"
        value={fields.image_url} onChange={update('image_url')} />
      <ErrorMessage message={error} />
      <FormActions pending={pending} label={submitLabel} pendingLabel="Saving…" onCancel={onCancel} />
    </form>
  )
}

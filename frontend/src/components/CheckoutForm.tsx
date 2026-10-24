// Checkout: choose paint, package, add-ons and delivery, see the running total, confirm.
// The total shown here is an estimate for the buyer; the server prices the order itself.
import { useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import type { CheckoutOption, CheckoutOptions, CheckoutSelection, Order, Vehicle } from '../api/types'
import { ErrorMessage } from './ErrorMessage'
import { formatPrice } from './formatPrice'
import { usePendingSubmit } from './usePendingSubmit'
import { VehiclePhoto } from './VehiclePhoto'
import { buttonClass } from './buttonStyles'

const priceTag = (price: number) => (price === 0 ? 'Included' : `+${formatPrice(price)}`)

function defaults(options: CheckoutOptions): CheckoutSelection {
  return {
    color: options.colors[0].code,
    package: options.packages[0].code,
    addons: [],
    delivery: options.delivery[0].code,
  }
}

function estimateTotal(base: number, options: CheckoutOptions, s: CheckoutSelection): number {
  const price = (list: CheckoutOption[], code: string) => list.find((o) => o.code === code)?.price ?? 0
  return base
    + price(options.colors, s.color)
    + price(options.packages, s.package)
    + s.addons.reduce((sum, code) => sum + price(options.addons, code), 0)
    + price(options.delivery, s.delivery)
}

function Group({ legend, children }: { legend: string; children: ReactNode }) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-semibold text-slate-900">{legend}</legend>
      <div className="grid gap-2 sm:grid-cols-2">{children}</div>
    </fieldset>
  )
}

function Choice({ type, name, option, checked, onChange }: {
  type: 'radio' | 'checkbox'
  name: string
  option: CheckoutOption
  checked: boolean
  onChange: () => void
}) {
  return (
    <label className={`flex cursor-pointer items-start gap-2 rounded-lg p-3 text-sm ring-1 transition ${
      checked ? 'bg-indigo-50 ring-indigo-500' : 'ring-slate-200 hover:bg-slate-50'}`}>
      <input type={type} name={name} checked={checked} onChange={onChange} className="mt-0.5 accent-indigo-600" />
      <span className="grow">
        <span className="block font-medium text-slate-900">{option.label}</span>
        {option.description && <span className="block text-xs text-slate-500">{option.description}</span>}
      </span>
      <span className="shrink-0 text-xs font-medium text-slate-600">{priceTag(option.price)}</span>
    </label>
  )
}

function Receipt({ order, onClose }: { order: Order; onClose: () => void }) {
  return (
    <section aria-label={`Order #${order.id} confirmed`} className="space-y-4">
      <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800 ring-1 ring-emerald-200">
        🎉 Order #{order.id} confirmed: your {order.make} {order.model} is on its way.
      </p>
      <ul className="divide-y divide-slate-100 text-sm">
        {order.line_items.map((item) => (
          <li key={item.label} className="flex justify-between py-1.5">
            <span className="text-slate-600">{item.label}</span>
            <span className="text-slate-900">{formatPrice(item.price)}</span>
          </li>
        ))}
        <li className="flex justify-between py-2 font-semibold">
          <span>Total paid</span>
          <span>{formatPrice(order.total_price)}</span>
        </li>
      </ul>
      <div className="flex justify-end">
        <button type="button" onClick={onClose}
          className={buttonClass({ variant: 'solid' })}>
          Done
        </button>
      </div>
    </section>
  )
}

export function CheckoutForm({ vehicle, options, onConfirm, onClose }: {
  vehicle: Vehicle
  options: CheckoutOptions | null
  onConfirm: (selection: CheckoutSelection) => Promise<Order>
  onClose: () => void
}) {
  if (options === null) {
    return <p role="status" className="py-8 text-center text-slate-500">Loading options…</p>
  }
  return <CheckoutChoices vehicle={vehicle} options={options} onConfirm={onConfirm} onClose={onClose} />
}

function CheckoutChoices({ vehicle, options, onConfirm, onClose }: {
  vehicle: Vehicle
  options: CheckoutOptions
  onConfirm: (selection: CheckoutSelection) => Promise<Order>
  onClose: () => void
}) {
  const [selection, setSelection] = useState(() => defaults(options))
  const [order, setOrder] = useState<Order | null>(null)
  const { pending, error, run } = usePendingSubmit()

  if (order) return <Receipt order={order} onClose={onClose} />

  const pick = (field: 'color' | 'package' | 'delivery', code: string) =>
    setSelection((s) => ({ ...s, [field]: code }))
  const toggleAddon = (code: string) =>
    setSelection((s) => ({
      ...s,
      addons: s.addons.includes(code) ? s.addons.filter((c) => c !== code) : [...s.addons, code],
    }))

  const total = estimateTotal(vehicle.price, options, selection)

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    void run(async () => setOrder(await onConfirm(selection)))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex items-center gap-4">
        <VehiclePhoto src={vehicle.image_url} name={`${vehicle.make} ${vehicle.model}`}
          className="h-20 w-32 shrink-0 rounded-lg" />
        <div>
          <p className="font-semibold text-slate-900">{vehicle.make} {vehicle.model}</p>
          <p className="text-sm text-slate-500">{vehicle.category} · base price {formatPrice(vehicle.price)}</p>
        </div>
      </div>

      <Group legend="Paint">
        {options.colors.map((o) => (
          <Choice key={o.code} type="radio" name="color" option={o}
            checked={selection.color === o.code} onChange={() => pick('color', o.code)} />
        ))}
      </Group>
      <Group legend="Package">
        {options.packages.map((o) => (
          <Choice key={o.code} type="radio" name="package" option={o}
            checked={selection.package === o.code} onChange={() => pick('package', o.code)} />
        ))}
      </Group>
      <Group legend="Add-ons">
        {options.addons.map((o) => (
          <Choice key={o.code} type="checkbox" name="addons" option={o}
            checked={selection.addons.includes(o.code)} onChange={() => toggleAddon(o.code)} />
        ))}
      </Group>
      <Group legend="Delivery">
        {options.delivery.map((o) => (
          <Choice key={o.code} type="radio" name="delivery" option={o}
            checked={selection.delivery === o.code} onChange={() => pick('delivery', o.code)} />
        ))}
      </Group>

      <ErrorMessage message={error} />

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
        <p className="text-sm text-slate-500">
          Total <span data-testid="checkout-total" className="ml-1 text-xl font-bold text-slate-900">{formatPrice(total)}</span>
        </p>
        <div className="flex gap-2">
          <button type="button" onClick={onClose}
            className={buttonClass({ variant: 'ghost' })}>
            Cancel
          </button>
          <button type="submit" disabled={pending}
            className={buttonClass({ variant: 'solid' })}>
            {pending ? 'Processing…' : 'Confirm purchase'}
          </button>
        </div>
      </div>
    </form>
  )
}

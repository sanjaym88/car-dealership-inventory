import type { Vehicle } from '../api/types'
import { formatPrice } from './formatPrice'

export function VehicleCard({ vehicle, onPurchase, purchasing = false }: {
  vehicle: Vehicle
  onPurchase: (vehicle: Vehicle) => void
  purchasing?: boolean
}) {
  const inStock = vehicle.quantity > 0
  return (
    <article className="flex flex-col rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-lg font-semibold text-slate-900">
          {vehicle.make} {vehicle.model}
        </h3>
        <span className="shrink-0 rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
          {vehicle.category}
        </span>
      </div>
      <p className="mt-4 text-2xl font-bold tracking-tight text-slate-900">{formatPrice(vehicle.price)}</p>
      <p className={`mt-1 text-sm font-medium ${inStock ? 'text-emerald-600' : 'text-rose-600'}`}>
        {inStock ? `${vehicle.quantity} in stock` : 'Out of stock'}
      </p>
      <button type="button" onClick={() => onPurchase(vehicle)} disabled={!inStock || purchasing}
        className="mt-5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 disabled:shadow-none">
        {purchasing ? 'Purchasing…' : 'Purchase'}
      </button>
    </article>
  )
}

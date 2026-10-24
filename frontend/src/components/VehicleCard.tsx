import { useId } from 'react'
import type { Vehicle } from '../api/types'
import { formatPrice } from './formatPrice'
import { VehiclePhoto } from './VehiclePhoto'
import { buttonClass } from './buttonStyles'

export interface AdminActions {
  onEdit: (vehicle: Vehicle) => void
  onRestock: (vehicle: Vehicle) => void
  onDelete: (vehicle: Vehicle) => void
}

export function VehicleCard({ vehicle, onPurchase, purchasing = false, admin }: {
  vehicle: Vehicle
  onPurchase: (vehicle: Vehicle) => void
  purchasing?: boolean
  /** Only passed for admins; regular users never see these controls. */
  admin?: AdminActions
}) {
  const headingId = useId()
  const inStock = vehicle.quantity > 0
  const name = `${vehicle.make} ${vehicle.model}`
  const adminButton = 'rounded-full px-3 py-1.5 text-xs font-medium transition-colors duration-300 ease-glide'

  return (
    <article aria-labelledby={headingId}
      className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-lg shadow-black/20 ring-1 ring-white/10 transition duration-500 ease-silk hover:-translate-y-1 hover:shadow-2xl hover:shadow-rose-900/30">
      <VehiclePhoto src={vehicle.image_url} name={name}
        className={`aspect-[16/10] ${inStock ? '' : 'opacity-60 grayscale'}`} />

      <div className="flex grow flex-col p-6">
        <div className="flex items-start justify-between gap-3">
          <h3 id={headingId} className="text-lg font-semibold text-slate-900">{name}</h3>
          <span className="shrink-0 rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
            {vehicle.category}
          </span>
        </div>
        <p className="mt-3 text-2xl font-bold tracking-tight text-slate-900">{formatPrice(vehicle.price)}</p>
        <p className={`mt-1 text-sm font-medium ${inStock ? 'text-emerald-600' : 'text-rose-600'}`}>
          {inStock ? `${vehicle.quantity} in stock` : 'Out of stock'}
        </p>

        {/* mt-auto keeps the button at the bottom so buttons line up across a row of cards */}
        <div className="mt-auto pt-5">
          <button type="button" onClick={() => onPurchase(vehicle)} disabled={!inStock || purchasing}
            className={buttonClass({ variant: 'solid', block: true })}>
            {purchasing ? 'Purchasing…' : 'Purchase'}
          </button>
        </div>

        {admin && (
          <div className="mt-3 flex gap-1 border-t border-slate-100 pt-3">
            <button type="button" onClick={() => admin.onEdit(vehicle)}
              className={`${adminButton} text-slate-700 hover:bg-slate-100`}>Edit</button>
            <button type="button" onClick={() => admin.onRestock(vehicle)}
              className={`${adminButton} text-indigo-700 hover:bg-indigo-50`}>Restock</button>
            <button type="button" onClick={() => admin.onDelete(vehicle)}
              className={`${adminButton} ml-auto text-rose-700 hover:bg-rose-50`}>Delete</button>
          </div>
        )}
      </div>
    </article>
  )
}

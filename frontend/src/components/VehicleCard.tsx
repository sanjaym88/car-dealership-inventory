import { PackagePlus, Pencil, Trash2 } from 'lucide-react'
import { useId } from 'react'
import type { Vehicle } from '../api/types'
import { buttonClass } from './buttonStyles'
import { formatPrice } from './formatPrice'
import { VehiclePhoto } from './VehiclePhoto'

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
  const adminButton =
    'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted transition-colors hover:bg-panel-2'

  return (
    <article aria-labelledby={headingId}
      className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-panel transition-colors duration-300 hover:border-neutral-600">
      <div className="relative">
        <VehiclePhoto src={vehicle.image_url} name={name}
          className={`aspect-[16/10] ${inStock ? '' : 'opacity-50 grayscale'}`} />
        <span className="absolute left-3 top-3 rounded-full bg-black/70 px-2.5 py-1 text-xs font-medium text-white">
          {vehicle.category}
        </span>
      </div>

      <div className="flex grow flex-col p-5">
        <h3 id={headingId} className="font-semibold text-white">{name}</h3>
        <div className="mt-2 flex items-baseline justify-between gap-3">
          <p className="text-xl font-bold tracking-tight text-white">{formatPrice(vehicle.price)}</p>
          <p className={`whitespace-nowrap text-xs font-medium ${inStock ? 'text-accent' : 'text-rose-400'}`}>
            {inStock ? `${vehicle.quantity} in stock` : 'Out of stock'}
          </p>
        </div>

        {/* mt-auto keeps the button at the bottom so buttons line up across a row of cards */}
        <div className="mt-auto pt-5">
          <button type="button" onClick={() => onPurchase(vehicle)} disabled={!inStock || purchasing}
            className={buttonClass({ variant: 'solid', block: true })}>
            {purchasing ? 'Purchasing…' : 'Purchase'}
          </button>
        </div>

        {admin && (
          <div className="mt-3 flex flex-wrap gap-1 border-t border-line pt-3">
            <button type="button" onClick={() => admin.onEdit(vehicle)} className={`${adminButton} hover:text-white`}>
              <Pencil aria-hidden="true" className="h-3.5 w-3.5" />
              Edit
            </button>
            <button type="button" onClick={() => admin.onRestock(vehicle)} className={`${adminButton} hover:text-accent`}>
              <PackagePlus aria-hidden="true" className="h-3.5 w-3.5" />
              Restock
            </button>
            <button type="button" onClick={() => admin.onDelete(vehicle)}
              className={`${adminButton} ml-auto hover:text-rose-400`}>
              <Trash2 aria-hidden="true" className="h-3.5 w-3.5" />
              Delete
            </button>
          </div>
        )}
      </div>
    </article>
  )
}

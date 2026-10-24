import { useEffect, useState } from 'react'
import { errorText } from '../api/errorText'
import type { Vehicle } from '../api/types'
import { vehiclesApi } from '../api/vehicles'
import { ErrorMessage } from '../components/ErrorMessage'
import { Header } from '../components/Header'
import { VehicleCard } from '../components/VehicleCard'

export function DashboardPage() {
  const [vehicles, setVehicles] = useState<Vehicle[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    vehiclesApi
      .list()
      .then(setVehicles)
      .catch((err: unknown) => setError(errorText(err)))
  }, [])

  const unitsInStock = vehicles?.reduce((sum, v) => sum + v.quantity, 0) ?? 0

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900">Inventory</h2>
          {vehicles && vehicles.length > 0 && (
            <p className="text-sm text-slate-500">
              {vehicles.length} models · {unitsInStock} units in stock
            </p>
          )}
        </div>

        <ErrorMessage message={error} />

        {vehicles === null && error === null && (
          <p role="status" className="py-16 text-center text-slate-500">Loading vehicles…</p>
        )}

        {vehicles?.length === 0 && (
          <p className="rounded-2xl border-2 border-dashed border-slate-200 py-16 text-center text-slate-500">
            No vehicles yet. Check back soon!
          </p>
        )}

        {vehicles && vehicles.length > 0 && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {vehicles.map((vehicle) => (
              <VehicleCard key={vehicle.id} vehicle={vehicle} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

import { useEffect, useMemo, useState } from 'react'
import { ApiError } from '../api/client'
import { errorText } from '../api/errorText'
import type { Vehicle, VehicleSearchParams } from '../api/types'
import { vehiclesApi } from '../api/vehicles'
import { ErrorMessage } from '../components/ErrorMessage'
import { Header } from '../components/Header'
import { SearchBar } from '../components/SearchBar'
import { VehicleCard } from '../components/VehicleCard'

export function DashboardPage() {
  // `inventory` is the full list (for the summary and category options);
  // `results` is what's shown: the full list, or the latest search results.
  const [inventory, setInventory] = useState<Vehicle[] | null>(null)
  const [results, setResults] = useState<Vehicle[] | null>(null)
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [purchasingId, setPurchasingId] = useState<number | null>(null)

  function loadAll() {
    vehiclesApi
      .list()
      .then((vehicles) => {
        setInventory(vehicles)
        setResults(vehicles)
        setSearching(false)
      })
      .catch((err: unknown) => setError(errorText(err)))
  }

  useEffect(loadAll, [])

  function handleClear() {
    setError(null)
    loadAll()
  }

  function handleSearch(params: VehicleSearchParams) {
    setError(null)
    vehiclesApi
      .search(params)
      .then((vehicles) => {
        setResults(vehicles)
        setSearching(true)
      })
      .catch((err: unknown) => setError(errorText(err)))
  }

  // Swap in a changed vehicle everywhere it is shown, so stock and summary stay in sync.
  function replaceVehicle(updated: Vehicle) {
    const swap = (list: Vehicle[] | null) =>
      list && list.map((v) => (v.id === updated.id ? updated : v))
    setInventory(swap)
    setResults(swap)
  }

  async function handlePurchase(vehicle: Vehicle) {
    setError(null)
    setNotice(null)
    setPurchasingId(vehicle.id)
    try {
      replaceVehicle(await vehiclesApi.purchase(vehicle.id))
      setNotice(`You bought a ${vehicle.make} ${vehicle.model}!`)
    } catch (err) {
      setError(errorText(err))
      // Out of stock on the server means our copy is stale: show it as sold out.
      if (err instanceof ApiError && err.status === 409) replaceVehicle({ ...vehicle, quantity: 0 })
    } finally {
      setPurchasingId(null)
    }
  }

  const categories = useMemo(
    () => [...new Set((inventory ?? []).map((v) => v.category))].sort(),
    [inventory],
  )
  const unitsInStock = inventory?.reduce((sum, v) => sum + v.quantity, 0) ?? 0

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900">Inventory</h2>
          {inventory && inventory.length > 0 && (
            <p className="text-sm text-slate-500">
              {inventory.length} models · {unitsInStock} units in stock
            </p>
          )}
        </div>

        <SearchBar categories={categories} onSearch={handleSearch} onClear={handleClear} />

        <ErrorMessage message={error} />
        {notice && (
          <p role="status" className="mb-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800 ring-1 ring-emerald-200">
            {notice}
          </p>
        )}

        {results === null && error === null && (
          <p role="status" className="py-16 text-center text-slate-500">Loading vehicles…</p>
        )}

        {searching && results && (
          <p className="mb-4 text-sm text-slate-500">
            {results.length} {results.length === 1 ? 'result' : 'results'}
          </p>
        )}

        {results?.length === 0 && (
          <p className="rounded-2xl border-2 border-dashed border-slate-200 py-16 text-center text-slate-500">
            {searching ? 'No vehicles match your search.' : 'No vehicles yet. Check back soon!'}
          </p>
        )}

        {results && results.length > 0 && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((vehicle) => (
              <VehicleCard key={vehicle.id} vehicle={vehicle} onPurchase={handlePurchase}
                purchasing={purchasingId === vehicle.id} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

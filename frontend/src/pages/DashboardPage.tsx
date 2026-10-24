import { useEffect, useMemo, useState } from 'react'
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
              <VehicleCard key={vehicle.id} vehicle={vehicle} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

import { ErrorMessage } from '../components/ErrorMessage'
import { Header } from '../components/Header'
import { SearchBar } from '../components/SearchBar'
import { VehicleCard } from '../components/VehicleCard'
import { useInventory } from './useInventory'

export function DashboardPage() {
  const {
    inventory, results, searching, error, notice, purchasingId,
    categories, unitsInStock, search, clearSearch, purchase,
  } = useInventory()

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

        <SearchBar categories={categories} onSearch={search} onClear={clearSearch} />

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
              <VehicleCard key={vehicle.id} vehicle={vehicle} onPurchase={purchase}
                purchasing={purchasingId === vehicle.id} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

// Inventory state for the dashboard: loading, searching and purchasing, kept separate from the markup.
import { useEffect, useMemo, useState } from 'react'
import { ApiError } from '../api/client'
import { errorText } from '../api/errorText'
import type { Vehicle, VehicleSearchParams } from '../api/types'
import { vehiclesApi } from '../api/vehicles'

export function useInventory() {
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

  function clearSearch() {
    setError(null)
    loadAll()
  }

  function search(params: VehicleSearchParams) {
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

  async function purchase(vehicle: Vehicle) {
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

  return {
    inventory, results, searching, error, notice, purchasingId,
    categories, unitsInStock, search, clearSearch, purchase,
  }
}

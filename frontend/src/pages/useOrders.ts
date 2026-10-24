// Loads a list of orders once, tracking loading and error state.
import { useEffect, useState } from 'react'
import { errorText } from '../api/errorText'
import type { Order } from '../api/types'

export function useOrders<T extends Order>(load: () => Promise<T[]>) {
  const [orders, setOrders] = useState<T[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    load()
      .then(setOrders)
      .catch((err: unknown) => setError(errorText(err)))
  }, [load])

  const total = orders?.reduce((sum, order) => sum + order.total_price, 0) ?? 0
  return { orders, error, total }
}

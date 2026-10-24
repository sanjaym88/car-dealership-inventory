// Admin view of every order: who bought what, when, and for how much.
import { DollarSign, Receipt, TrendingUp } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { ordersApi } from '../api/orders'
import { ErrorMessage } from '../components/ErrorMessage'
import { formatDate } from '../components/formatDate'
import { formatPrice } from '../components/formatPrice'
import { PageShell } from '../components/PageShell'
import { useOrders } from './useOrders'

function Stat({ label, value, icon: Icon }: { label: string; value: string; icon: LucideIcon }) {
  return (
    <div className="rounded-2xl border border-line bg-panel p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">{label}</p>
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-panel-2 text-accent">
          <Icon aria-hidden="true" className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-3 text-2xl font-bold tracking-tight text-white">{value}</p>
    </div>
  )
}

export function SalesPage() {
  const { orders, error, total } = useOrders(ordersApi.all)

  return (
    <PageShell title="Sales">
      <ErrorMessage message={error} />
      {orders === null && error === null && (
        <p role="status" className="py-16 text-center text-neutral-200">Loading sales…</p>
      )}
      {orders?.length === 0 && (
        <p className="rounded-2xl border border-neutral-800 bg-neutral-900 py-16 text-center text-neutral-200">
          No sales yet.
        </p>
      )}
      {orders && orders.length > 0 && (
        <>
          <div className="mb-6 grid gap-5 sm:grid-cols-3">
            <Stat label="Orders" icon={Receipt} value={`${orders.length} ${orders.length === 1 ? 'order' : 'orders'}`} />
            <Stat label="Revenue" icon={DollarSign} value={formatPrice(total)} />
            <Stat label="Average order" icon={TrendingUp} value={formatPrice(Math.round(total / orders.length))} />
          </div>
          <div className="overflow-x-auto rounded-2xl border border-line bg-panel">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line bg-panel-2 text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Buyer</th>
                  <th className="px-4 py-3">Vehicle</th>
                  <th className="px-4 py-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td className="px-4 py-3 font-medium text-white">#{order.id}</td>
                    <td className="px-4 py-3 text-neutral-300">{formatDate(order.created_at)}</td>
                    <td className="px-4 py-3 text-neutral-300">{order.buyer_email}</td>
                    <td className="px-4 py-3 text-white">{order.make} {order.model}</td>
                    <td className="px-4 py-3 text-right font-medium text-white">{formatPrice(order.total_price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </PageShell>
  )
}

// Admin view of every order: who bought what, when, and for how much.
import { ordersApi } from '../api/orders'
import { ErrorMessage } from '../components/ErrorMessage'
import { formatDate } from '../components/formatDate'
import { formatPrice } from '../components/formatPrice'
import { PageShell } from '../components/PageShell'
import { useOrders } from './useOrders'

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
    </div>
  )
}

export function SalesPage() {
  const { orders, error, total } = useOrders(ordersApi.all)

  return (
    <PageShell title="Sales">
      <ErrorMessage message={error} />
      {orders === null && error === null && (
        <p role="status" className="py-16 text-center text-slate-500">Loading sales…</p>
      )}
      {orders?.length === 0 && (
        <p className="rounded-2xl border-2 border-dashed border-slate-200 py-16 text-center text-slate-500">
          No sales yet.
        </p>
      )}
      {orders && orders.length > 0 && (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-2">
            <Stat label="Orders" value={`${orders.length} ${orders.length === 1 ? 'order' : 'orders'}`} />
            <Stat label="Revenue" value={formatPrice(total)} />
          </div>
          <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Buyer</th>
                  <th className="px-4 py-3">Vehicle</th>
                  <th className="px-4 py-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td className="px-4 py-3 font-medium text-slate-900">#{order.id}</td>
                    <td className="px-4 py-3 text-slate-600">{formatDate(order.created_at)}</td>
                    <td className="px-4 py-3 text-slate-600">{order.buyer_email}</td>
                    <td className="px-4 py-3 text-slate-900">{order.make} {order.model}</td>
                    <td className="px-4 py-3 text-right font-medium text-slate-900">{formatPrice(order.total_price)}</td>
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

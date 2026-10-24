// The logged-in user's purchase history, each order with its receipt.
import { Link } from 'react-router'
import { ordersApi } from '../api/orders'
import type { Order } from '../api/types'
import { ErrorMessage } from '../components/ErrorMessage'
import { formatDate } from '../components/formatDate'
import { formatPrice } from '../components/formatPrice'
import { PageShell } from '../components/PageShell'
import { VehiclePhoto } from '../components/VehiclePhoto'
import { useOrders } from './useOrders'

function OrderCard({ order }: { order: Order }) {
  const name = `${order.make} ${order.model}`
  return (
    <article aria-label={name}
      className="flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:flex-row">
      <VehiclePhoto src={order.image_url} name={name} className="aspect-[16/10] rounded-xl sm:w-56 sm:shrink-0" />
      <div className="grow">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-lg font-semibold text-slate-900">{name}</h3>
          <p className="text-sm text-slate-500">Order #{order.id} · {formatDate(order.created_at)}</p>
        </div>
        <ul className="mt-2 divide-y divide-slate-100 text-sm">
          {order.line_items.map((item) => (
            <li key={item.label} className="flex justify-between py-1">
              <span className="text-slate-600">{item.label}</span>
              <span className="text-slate-900">{formatPrice(item.price)}</span>
            </li>
          ))}
          <li className="flex justify-between py-1.5 font-semibold text-slate-900">
            <span>Total</span>
            <span>{formatPrice(order.total_price)}</span>
          </li>
        </ul>
      </div>
    </article>
  )
}

export function OrdersPage() {
  const { orders, error, total } = useOrders(ordersApi.mine)

  const subtitle = orders && orders.length > 0
    ? `${orders.length} ${orders.length === 1 ? 'order' : 'orders'} · ${formatPrice(total)} total`
    : undefined

  return (
    <PageShell title="My orders" subtitle={subtitle}>
      <ErrorMessage message={error} />
      {orders === null && error === null && (
        <p role="status" className="py-16 text-center text-slate-300">Loading orders…</p>
      )}
      {orders?.length === 0 && (
        <div className="rounded-2xl border-2 border-dashed border-white/15 bg-white/5 py-16 text-center text-slate-300 backdrop-blur">
          <p>You haven't bought anything yet.</p>
          <Link to="/" className="mt-2 inline-block font-medium text-rose-300 transition hover:text-rose-200 hover:underline">
            Browse the inventory
          </Link>
        </div>
      )}
      {orders && orders.length > 0 && (
        <div className="space-y-4">
          {orders.map((order) => <OrderCard key={order.id} order={order} />)}
        </div>
      )}
    </PageShell>
  )
}

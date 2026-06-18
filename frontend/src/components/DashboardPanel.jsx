import SectionCard from './SectionCard'
import StatCard from './StatCard'
import EmptyState from './EmptyState'
import { formatCurrency, summarizeItems } from '../utils'

function DashboardPanel({ summary, products, orders, customers, loading }) {
  const totalInventoryUnits = products.reduce((total, product) => total + product.quantity_in_stock, 0)
  const totalRevenue = orders
    .filter((order) => order.status === 'active')
    .reduce((total, order) => total + Number(order.total_amount), 0)

  return (
    <SectionCard
      id="dashboard"
      eyebrow="Command Center"
      title="Operations overview"
      description="A quick pulse on catalog coverage, customer growth, order throughput, and inventory health."
    >
      <div className="stats-grid">
        <StatCard
          label="Products"
          value={summary.total_products}
          caption={`${totalInventoryUnits} units currently tracked`}
        />
        <StatCard
          label="Customers"
          value={summary.total_customers}
          caption={customers.length ? 'Customer directory is active' : 'Add your first customer to start taking orders'}
          tone="warm"
        />
        <StatCard
          label="Orders"
          value={summary.total_orders}
          caption={`${orders.filter((order) => order.status === 'active').length} active orders on the books`}
        />
        <StatCard
          label="Revenue"
          value={formatCurrency(totalRevenue)}
          caption="Calculated from active orders"
          tone="accent"
        />
      </div>

      <div className="dashboard-grid">
        <article className="surface-card">
          <div className="surface-card__heading">
            <h3>Low stock watchlist</h3>
            <span>{summary.low_stock_products.length} flagged</span>
          </div>
          {summary.low_stock_products.length ? (
            <div className="stack-list">
              {summary.low_stock_products.map((product) => (
                <div className="stack-list__item" key={product.id}>
                  <div>
                    <strong>{product.name}</strong>
                    <p>
                      {product.sku} · {formatCurrency(product.price)}
                    </p>
                  </div>
                  <span className={`pill ${product.quantity_in_stock <= 2 ? 'pill--danger' : 'pill--warning'}`}>
                    {product.quantity_in_stock} left
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="Inventory looks healthy" description="Products with 5 units or fewer will appear here." />
          )}
        </article>

        <article className="surface-card">
          <div className="surface-card__heading">
            <h3>Recent order activity</h3>
            <span>{orders.length} total</span>
          </div>
          {orders.length ? (
            <div className="stack-list">
              {orders.slice(0, 5).map((order) => (
                <div className="stack-list__item" key={order.id}>
                  <div>
                    <strong>Order #{order.id}</strong>
                    <p>
                      {order.customer_name} · {summarizeItems(order.items)}
                    </p>
                  </div>
                  <span className={`pill ${order.status === 'cancelled' ? 'pill--neutral' : 'pill--success'}`}>
                    {order.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title={loading ? 'Loading orders' : 'No orders yet'}
              description="New orders will appear here as soon as they are created."
            />
          )}
        </article>
      </div>
    </SectionCard>
  )
}

export default DashboardPanel

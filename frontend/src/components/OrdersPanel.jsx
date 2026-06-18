import EmptyState from './EmptyState'
import SectionCard from './SectionCard'
import { formatCurrency, formatDate, summarizeItems } from '../utils'

function OrdersPanel({
  customers,
  products,
  orders,
  orderForm,
  onOrderFormChange,
  onOrderItemChange,
  onAddOrderItem,
  onRemoveOrderItem,
  onSubmitOrder,
  onSelectOrder,
  selectedOrder,
  onCancelOrder,
  saving,
}) {
  return (
    <SectionCard
      id="orders"
      eyebrow="Fulfillment"
      title="Order management"
      description="Place orders against live inventory, review the totals, and cancel with stock restoration when needed."
    >
      <div className="panel-grid panel-grid--orders">
        <form className="surface-card form-card" onSubmit={onSubmitOrder}>
          <div className="surface-card__heading">
            <h3>Create order</h3>
            <span>Stock-aware checkout</span>
          </div>
          <label>
            Customer
            <select name="customer_id" value={orderForm.customer_id} onChange={onOrderFormChange} required>
              <option value="">Select a customer</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.full_name} ({customer.email})
                </option>
              ))}
            </select>
          </label>
          <div className="order-items">
            {orderForm.items.map((item, index) => (
              <div className="order-item" key={`${index}-${item.product_id}`}>
                <label>
                  Product
                  <select
                    value={item.product_id}
                    onChange={(event) => onOrderItemChange(index, 'product_id', event.target.value)}
                    required
                  >
                    <option value="">Select a product</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name} ({product.sku}) · {product.quantity_in_stock} in stock
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Quantity
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={item.quantity}
                    onChange={(event) => onOrderItemChange(index, 'quantity', event.target.value)}
                    required
                  />
                </label>
                <button
                  type="button"
                  className="button-secondary"
                  onClick={() => onRemoveOrderItem(index)}
                  disabled={orderForm.items.length === 1}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
          <div className="form-actions form-actions--split">
            <button type="button" className="button-secondary" onClick={onAddOrderItem}>
              Add another item
            </button>
            <button type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Create order'}
            </button>
          </div>
        </form>

        <div className="orders-column">
          <div className="surface-card list-card">
            <div className="surface-card__heading">
              <h3>Orders</h3>
              <span>{orders.length} records</span>
            </div>
            {orders.length ? (
              <div className="stack-list">
                {orders.map((order) => (
                  <button
                    type="button"
                    key={order.id}
                    className={`order-list-item ${selectedOrder?.id === order.id ? 'order-list-item--active' : ''}`}
                    onClick={() => onSelectOrder(order.id)}
                  >
                    <div>
                      <strong>Order #{order.id}</strong>
                      <p>
                        {order.customer_name} · {summarizeItems(order.items)}
                      </p>
                    </div>
                    <div className="order-list-item__meta">
                      <span className={`pill ${order.status === 'cancelled' ? 'pill--neutral' : 'pill--success'}`}>
                        {order.status}
                      </span>
                      <span>{formatCurrency(order.total_amount)}</span>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <EmptyState title="No orders yet" description="Create an order to populate this activity list." />
            )}
          </div>

          <div className="surface-card detail-card">
            <div className="surface-card__heading">
              <h3>Order details</h3>
              <span>{selectedOrder ? `#${selectedOrder.id}` : 'Awaiting selection'}</span>
            </div>
            {selectedOrder ? (
              <div className="detail-stack">
                <div className="detail-row">
                  <span>Customer</span>
                  <strong>{selectedOrder.customer_name}</strong>
                </div>
                <div className="detail-row">
                  <span>Email</span>
                  <strong>{selectedOrder.customer_email}</strong>
                </div>
                <div className="detail-row">
                  <span>Status</span>
                  <span className={`pill ${selectedOrder.status === 'cancelled' ? 'pill--neutral' : 'pill--success'}`}>
                    {selectedOrder.status}
                  </span>
                </div>
                <div className="detail-row">
                  <span>Placed</span>
                  <strong>{formatDate(selectedOrder.created_at)}</strong>
                </div>
                <div className="line-items">
                  {selectedOrder.items.map((item) => (
                    <div className="line-items__row" key={item.id}>
                      <div>
                        <strong>{item.product_name}</strong>
                        <p>
                          {item.product_sku} · {item.quantity} x {formatCurrency(item.unit_price)}
                        </p>
                      </div>
                      <strong>{formatCurrency(item.line_total)}</strong>
                    </div>
                  ))}
                </div>
                <div className="detail-row detail-row--total">
                  <span>Total amount</span>
                  <strong>{formatCurrency(selectedOrder.total_amount)}</strong>
                </div>
                <button
                  type="button"
                  className="button-danger"
                  onClick={() => onCancelOrder(selectedOrder)}
                  disabled={selectedOrder.status === 'cancelled'}
                >
                  {selectedOrder.status === 'cancelled' ? 'Order cancelled' : 'Cancel order'}
                </button>
              </div>
            ) : (
              <EmptyState title="Select an order" description="Choose an order from the list to inspect line items and totals." />
            )}
          </div>
        </div>
      </div>
    </SectionCard>
  )
}

export default OrdersPanel

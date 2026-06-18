import { startTransition, useCallback, useDeferredValue, useEffect, useState } from 'react'
import './App.css'
import { api, API_BASE_URL } from './api'
import StatusBanner from './components/StatusBanner'
import DashboardPanel from './components/DashboardPanel'
import ProductsPanel from './components/ProductsPanel'
import CustomersPanel from './components/CustomersPanel'
import OrdersPanel from './components/OrdersPanel'

const emptyProductForm = {
  name: '',
  sku: '',
  price: '',
  quantity_in_stock: '',
}

const emptyCustomerForm = {
  full_name: '',
  email: '',
  phone_number: '',
}

const emptyOrderForm = {
  customer_id: '',
  items: [{ product_id: '', quantity: 1 }],
}

function App() {
  const [summary, setSummary] = useState({
    total_products: 0,
    total_customers: 0,
    total_orders: 0,
    low_stock_products: [],
  })
  const [products, setProducts] = useState([])
  const [customers, setCustomers] = useState([])
  const [orders, setOrders] = useState([])
  const [selectedOrderId, setSelectedOrderId] = useState(null)
  const [productForm, setProductForm] = useState(emptyProductForm)
  const [customerForm, setCustomerForm] = useState(emptyCustomerForm)
  const [orderForm, setOrderForm] = useState(emptyOrderForm)
  const [editingProductId, setEditingProductId] = useState(null)
  const [productSearch, setProductSearch] = useState('')
  const [message, setMessage] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [saving, setSaving] = useState(false)

  const deferredProductSearch = useDeferredValue(productSearch)
  const filteredProducts = products.filter((product) => {
    const query = deferredProductSearch.trim().toLowerCase()
    if (!query) {
      return true
    }

    return `${product.name} ${product.sku}`.toLowerCase().includes(query)
  })
  const selectedOrder = orders.find((order) => order.id === selectedOrderId) || null

  const refreshData = useCallback(async (orderToFocus = null) => {
    setRefreshing(true)

    try {
      const [summaryData, productsData, customersData, ordersData] = await Promise.all([
        api.getSummary(),
        api.getProducts(),
        api.getCustomers(),
        api.getOrders(),
      ])

      startTransition(() => {
        setSummary(summaryData)
        setProducts(productsData)
        setCustomers(customersData)
        setOrders(ordersData)
      })

      if (orderToFocus && ordersData.some((order) => order.id === orderToFocus)) {
        setSelectedOrderId(orderToFocus)
      } else {
        setSelectedOrderId((currentSelectedOrderId) => {
          if (currentSelectedOrderId && ordersData.some((order) => order.id === currentSelectedOrderId)) {
            return currentSelectedOrderId
          }

          return ordersData[0]?.id ?? null
        })
      }
    } catch (error) {
      showMessage(error.message, 'error')
    } finally {
      setRefreshing(false)
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    queueMicrotask(() => {
      void refreshData()
    })
  }, [refreshData])

  useEffect(() => {
    if (!message) {
      return undefined
    }

    const timer = window.setTimeout(() => {
      setMessage(null)
    }, 5000)

    return () => window.clearTimeout(timer)
  }, [message])

  function showMessage(text, type = 'success') {
    setMessage({ text, type })
  }

  function handleProductFormChange(event) {
    const { name, value } = event.target
    setProductForm((current) => ({ ...current, [name]: value }))
  }

  function handleCustomerFormChange(event) {
    const { name, value } = event.target
    setCustomerForm((current) => ({ ...current, [name]: value }))
  }

  function handleOrderFormChange(event) {
    const { name, value } = event.target
    setOrderForm((current) => ({ ...current, [name]: value }))
  }

  function handleOrderItemChange(index, field, value) {
    setOrderForm((current) => ({
      ...current,
      items: current.items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: field === 'quantity' ? Number(value) || '' : value } : item,
      ),
    }))
  }

  function handleAddOrderItem() {
    setOrderForm((current) => ({
      ...current,
      items: [...current.items, { product_id: '', quantity: 1 }],
    }))
  }

  function handleRemoveOrderItem(index) {
    setOrderForm((current) => ({
      ...current,
      items: current.items.filter((_, itemIndex) => itemIndex !== index),
    }))
  }

  function startProductEdit(product) {
    setEditingProductId(product.id)
    setProductForm({
      name: product.name,
      sku: product.sku,
      price: product.price,
      quantity_in_stock: product.quantity_in_stock,
    })
    window.location.hash = '#products'
  }

  function cancelProductEdit() {
    setEditingProductId(null)
    setProductForm(emptyProductForm)
  }

  async function handleSubmitProduct(event) {
    event.preventDefault()
    setSaving(true)

    try {
      const payload = {
        ...productForm,
        price: Number(productForm.price).toFixed(2),
        quantity_in_stock: Number(productForm.quantity_in_stock),
      }

      if (editingProductId) {
        await api.updateProduct(editingProductId, payload)
        showMessage('Product updated successfully.')
      } else {
        await api.createProduct(payload)
        showMessage('Product created successfully.')
      }

      cancelProductEdit()
      await refreshData()
    } catch (error) {
      showMessage(error.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteProduct(product) {
    if (!window.confirm(`Delete product "${product.name}"?`)) {
      return
    }

    try {
      await api.deleteProduct(product.id)
      if (editingProductId === product.id) {
        cancelProductEdit()
      }
      showMessage('Product deleted successfully.')
      await refreshData()
    } catch (error) {
      showMessage(error.message, 'error')
    }
  }

  async function handleSubmitCustomer(event) {
    event.preventDefault()
    setSaving(true)

    try {
      await api.createCustomer(customerForm)
      setCustomerForm(emptyCustomerForm)
      showMessage('Customer created successfully.')
      await refreshData()
    } catch (error) {
      showMessage(error.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteCustomer(customer) {
    if (!window.confirm(`Delete customer "${customer.full_name}"?`)) {
      return
    }

    try {
      await api.deleteCustomer(customer.id)
      showMessage('Customer deleted successfully.')
      await refreshData()
    } catch (error) {
      showMessage(error.message, 'error')
    }
  }

  async function handleSubmitOrder(event) {
    event.preventDefault()
    setSaving(true)

    try {
      const payload = {
        customer_id: Number(orderForm.customer_id),
        items: orderForm.items.map((item) => ({
          product_id: Number(item.product_id),
          quantity: Number(item.quantity),
        })),
      }

      const createdOrder = await api.createOrder(payload)
      setOrderForm(emptyOrderForm)
      setSelectedOrderId(createdOrder.id)
      showMessage('Order created successfully.')
      await refreshData(createdOrder.id)
    } catch (error) {
      showMessage(error.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleCancelOrder(order) {
    if (!window.confirm(`Cancel order #${order.id}? Inventory will be restored.`)) {
      return
    }

    try {
      await api.deleteOrder(order.id)
      showMessage('Order cancelled and inventory restored.')
      await refreshData(order.id)
    } catch (error) {
      showMessage(error.message, 'error')
    }
  }

  return (
    <div className="app-shell">
      <header className="hero-panel">
        <div className="hero-panel__content">
          <span className="hero-panel__eyebrow">Inventory & Order Management System</span>
          <h1>Container-ready operations, built for product, customer, and order flow.</h1>
          <p>
            Run the full stack locally with Docker Compose or deploy the frontend and backend separately with
            environment-based configuration.
          </p>
          <div className="hero-panel__actions">
            <a href="#dashboard">View dashboard</a>
            <a href="#orders" className="button-secondary">
              Jump to orders
            </a>
          </div>
        </div>
        <aside className="hero-panel__meta">
          <div>
            <span>Backend API</span>
            <strong>{API_BASE_URL}</strong>
          </div>
          <div>
            <span>Data refresh</span>
            <strong>{refreshing ? 'Refreshing now' : 'Ready'}</strong>
          </div>
          <button type="button" onClick={() => refreshData(selectedOrderId)} disabled={refreshing}>
            {refreshing ? 'Refreshing...' : 'Refresh data'}
          </button>
        </aside>
      </header>

      <nav className="quick-nav" aria-label="Primary sections">
        <a href="#dashboard">Dashboard</a>
        <a href="#products">Products</a>
        <a href="#customers">Customers</a>
        <a href="#orders">Orders</a>
      </nav>

      <StatusBanner message={message} onDismiss={() => setMessage(null)} />

      <main className="content-stack">
        <DashboardPanel
          summary={summary}
          products={products}
          customers={customers}
          orders={orders}
          loading={loading}
        />
        <ProductsPanel
          products={filteredProducts}
          productSearch={productSearch}
          onSearchChange={(event) => setProductSearch(event.target.value)}
          productForm={productForm}
          onProductFormChange={handleProductFormChange}
          onSubmitProduct={handleSubmitProduct}
          onStartEdit={startProductEdit}
          onCancelEdit={cancelProductEdit}
          onDeleteProduct={handleDeleteProduct}
          editingProductId={editingProductId}
          saving={saving}
        />
        <CustomersPanel
          customers={customers}
          customerForm={customerForm}
          onCustomerFormChange={handleCustomerFormChange}
          onSubmitCustomer={handleSubmitCustomer}
          onDeleteCustomer={handleDeleteCustomer}
          saving={saving}
        />
        <OrdersPanel
          customers={customers}
          products={products}
          orders={orders}
          orderForm={orderForm}
          onOrderFormChange={handleOrderFormChange}
          onOrderItemChange={handleOrderItemChange}
          onAddOrderItem={handleAddOrderItem}
          onRemoveOrderItem={handleRemoveOrderItem}
          onSubmitOrder={handleSubmitOrder}
          onSelectOrder={setSelectedOrderId}
          selectedOrder={selectedOrder}
          onCancelOrder={handleCancelOrder}
          saving={saving}
        />
      </main>
    </div>
  )
}

export default App

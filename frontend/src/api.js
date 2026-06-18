const runtimeBaseUrl = window.__APP_CONFIG__?.API_BASE_URL
const defaultBaseUrl = `${window.location.protocol}//${window.location.hostname || 'localhost'}:8000`

export const API_BASE_URL = (runtimeBaseUrl || import.meta.env.VITE_API_BASE_URL || defaultBaseUrl).replace(/\/$/, '')

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  })

  if (response.status === 204) {
    return null
  }

  const text = await response.text()
  let payload = null

  if (text) {
    try {
      payload = JSON.parse(text)
    } catch {
      payload = { detail: text }
    }
  }

  if (!response.ok) {
    throw new Error(payload?.detail || 'Something went wrong while contacting the API.')
  }

  return payload
}

export const api = {
  getSummary: () => request('/dashboard/summary'),
  getProducts: () => request('/products'),
  getCustomers: () => request('/customers'),
  getOrders: () => request('/orders'),
  getOrder: (orderId) => request(`/orders/${orderId}`),
  createProduct: (payload) => request('/products', { method: 'POST', body: JSON.stringify(payload) }),
  updateProduct: (productId, payload) =>
    request(`/products/${productId}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteProduct: (productId) => request(`/products/${productId}`, { method: 'DELETE' }),
  createCustomer: (payload) => request('/customers', { method: 'POST', body: JSON.stringify(payload) }),
  deleteCustomer: (customerId) => request(`/customers/${customerId}`, { method: 'DELETE' }),
  createOrder: (payload) => request('/orders', { method: 'POST', body: JSON.stringify(payload) }),
  deleteOrder: (orderId) => request(`/orders/${orderId}`, { method: 'DELETE' }),
}

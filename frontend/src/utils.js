const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
})

export function formatCurrency(value) {
  return currencyFormatter.format(Number(value || 0))
}

export function formatDate(value) {
  if (!value) {
    return 'Not available'
  }

  return new Date(value).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function summarizeItems(items) {
  if (!items?.length) {
    return 'No items'
  }

  return items.map((item) => `${item.product_name} x${item.quantity}`).join(', ')
}

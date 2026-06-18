import EmptyState from './EmptyState'
import SectionCard from './SectionCard'
import { formatCurrency } from '../utils'

function ProductsPanel({
  products,
  productSearch,
  onSearchChange,
  productForm,
  onProductFormChange,
  onSubmitProduct,
  onStartEdit,
  onCancelEdit,
  onDeleteProduct,
  editingProductId,
  saving,
}) {
  return (
    <SectionCard
      id="products"
      eyebrow="Catalog"
      title="Product management"
      description="Create, update, and retire products while keeping SKU integrity and stock counts under control."
    >
      <div className="panel-grid panel-grid--products">
        <form className="surface-card form-card" onSubmit={onSubmitProduct}>
          <div className="surface-card__heading">
            <h3>{editingProductId ? 'Update product' : 'Add product'}</h3>
            <span>{editingProductId ? 'Edit mode' : 'Create mode'}</span>
          </div>
          <label>
            Product name
            <input
              name="name"
              value={productForm.name}
              onChange={onProductFormChange}
              placeholder="Warehouse Shelf A Monitor"
              required
            />
          </label>
          <label>
            SKU / code
            <input
              name="sku"
              value={productForm.sku}
              onChange={onProductFormChange}
              placeholder="MON-2401"
              required
            />
          </label>
          <div className="form-row">
            <label>
              Price
              <input
                name="price"
                type="number"
                min="0.01"
                step="0.01"
                value={productForm.price}
                onChange={onProductFormChange}
                placeholder="299.99"
                required
              />
            </label>
            <label>
              Quantity in stock
              <input
                name="quantity_in_stock"
                type="number"
                min="0"
                step="1"
                value={productForm.quantity_in_stock}
                onChange={onProductFormChange}
                placeholder="18"
                required
              />
            </label>
          </div>
          <div className="form-actions">
            <button type="submit" disabled={saving}>
              {saving ? 'Saving...' : editingProductId ? 'Save changes' : 'Add product'}
            </button>
            {editingProductId ? (
              <button type="button" className="button-secondary" onClick={onCancelEdit}>
                Cancel
              </button>
            ) : null}
          </div>
        </form>

        <div className="surface-card list-card">
          <div className="surface-card__heading">
            <h3>Product list</h3>
            <span>{products.length} items</span>
          </div>
          <label className="search-field">
            Search products
            <input value={productSearch} onChange={onSearchChange} placeholder="Find by name or SKU" />
          </label>
          {products.length ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>SKU</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id}>
                      <td>{product.name}</td>
                      <td>{product.sku}</td>
                      <td>{formatCurrency(product.price)}</td>
                      <td>
                        <span className={`pill ${product.quantity_in_stock <= 5 ? 'pill--warning' : 'pill--success'}`}>
                          {product.quantity_in_stock}
                        </span>
                      </td>
                      <td className="actions-cell">
                        <button type="button" className="button-secondary" onClick={() => onStartEdit(product)}>
                          Edit
                        </button>
                        <button type="button" className="button-danger" onClick={() => onDeleteProduct(product)}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState title="No matching products" description="Adjust the search or add a new item to the catalog." />
          )}
        </div>
      </div>
    </SectionCard>
  )
}

export default ProductsPanel

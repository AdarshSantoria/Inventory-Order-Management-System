import EmptyState from './EmptyState'
import SectionCard from './SectionCard'

function CustomersPanel({
  customers,
  customerForm,
  onCustomerFormChange,
  onSubmitCustomer,
  onDeleteCustomer,
  saving,
}) {
  return (
    <SectionCard
      id="customers"
      eyebrow="Relationships"
      title="Customer management"
      description="Capture a clean customer directory with unique emails so ordering stays dependable."
    >
      <div className="panel-grid panel-grid--customers">
        <form className="surface-card form-card" onSubmit={onSubmitCustomer}>
          <div className="surface-card__heading">
            <h3>Add customer</h3>
            <span>Contact profile</span>
          </div>
          <label>
            Full name
            <input
              name="full_name"
              value={customerForm.full_name}
              onChange={onCustomerFormChange}
              placeholder="Jordan Reeves"
              required
            />
          </label>
          <label>
            Email address
            <input
              name="email"
              type="email"
              value={customerForm.email}
              onChange={onCustomerFormChange}
              placeholder="jordan@example.com"
              required
            />
          </label>
          <label>
            Phone number
            <input
              name="phone_number"
              value={customerForm.phone_number}
              onChange={onCustomerFormChange}
              placeholder="+1 555 010 2233"
              required
            />
          </label>
          <div className="form-actions">
            <button type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Add customer'}
            </button>
          </div>
        </form>

        <div className="surface-card list-card">
          <div className="surface-card__heading">
            <h3>Customer list</h3>
            <span>{customers.length} profiles</span>
          </div>
          {customers.length ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((customer) => (
                    <tr key={customer.id}>
                      <td>{customer.full_name}</td>
                      <td>{customer.email}</td>
                      <td>{customer.phone_number}</td>
                      <td className="actions-cell">
                        <button
                          type="button"
                          className="button-danger"
                          onClick={() => onDeleteCustomer(customer)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState title="No customers yet" description="Add a customer so you can start creating orders." />
          )}
        </div>
      </div>
    </SectionCard>
  )
}

export default CustomersPanel

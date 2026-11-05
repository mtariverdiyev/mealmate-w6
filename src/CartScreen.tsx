import type { Order } from './api'
import './CartScreen.css'

type CartScreenProps = {
  busy: boolean
  loadError: string
  onBack: () => void
  onCancelOrder: (orderId: string) => void
  onNavigateToAdmin: () => void
  orders: Order[]
  userName: string
}

function CartScreen({
  busy,
  loadError,
  onBack,
  onCancelOrder,
  onNavigateToAdmin,
  orders,
  userName,
}: CartScreenProps) {
  const userInitials = userName
    .trim()
    .split(/\s+/)
    .filter((part) => /\p{L}/u.test(part))
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('')

  return (
    <main className="cart-screen">
      <header className="cart-header">
        <div className="cart-brand">
          <span className="cart-brand-mark" aria-hidden="true">
            M
          </span>
          <span className="cart-brand-name">MealMate</span>
        </div>
        <span
          aria-label={`Signed in as ${userName}`}
          className="cart-profile-initials"
          title={userName}
        >
          {userInitials}
        </span>
      </header>

      <nav className="cart-tabs" aria-label="Staff navigation">
        <button className="cart-tab" onClick={onBack} type="button">
          My lunch
        </button>
        <button className="cart-tab" onClick={onNavigateToAdmin} type="button">
          Admin
        </button>
      </nav>

      <section className="cart-content">
        <button className="cart-back" onClick={onBack} type="button">
          <span aria-hidden="true">←</span> Back to menu
        </button>

        <p className="cart-eyebrow">Today’s order</p>
        <h1>Your order</h1>
        <p className="cart-description">
          Orders are saved on the server. Cancel only removes your own order.
        </p>

        {loadError ? (
          <p className="cart-empty" role="alert">
            {loadError}
          </p>
        ) : null}

        <section className="cart-items" aria-label="Your orders">
          {orders.length > 0 ? (
            orders.map((order) => (
              <article className="cart-item" key={order.id}>
                <div className="cart-item-heading">
                  <div>
                    <h2>{order.dishName}</h2>
                    <p>Ordered by {order.staffName}</p>
                  </div>
                </div>
                <div className="cart-item-actions">
                  <button
                    aria-label={`Cancel order for ${order.dishName}`}
                    className="cart-remove"
                    disabled={busy}
                    onClick={() => onCancelOrder(order.id)}
                    type="button"
                  >
                    <svg viewBox="0 0 16 16" aria-hidden="true">
                      <path d="M3 4h10M6 4V2.5h4V4m2 0-.6 9H4.6L4 4m2.5 2.5v4m3-4v4" />
                    </svg>
                    Cancel
                  </button>
                </div>
              </article>
            ))
          ) : (
            <p className="cart-empty">You have no orders yet.</p>
          )}
        </section>

        <section className="cart-total" aria-label="Order count">
          <div className="cart-total-caption">
            <span>
              {orders.length} {orders.length === 1 ? 'order' : 'orders'}
            </span>
            <span>Today</span>
          </div>
          <div className="cart-total-amount">
            <span>Saved on server</span>
            <strong>{orders.length}</strong>
          </div>
        </section>
      </section>
    </main>
  )
}

export default CartScreen

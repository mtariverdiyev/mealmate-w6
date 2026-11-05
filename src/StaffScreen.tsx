import { useEffect, useState } from 'react'
import { formatPrice, type Dish, type Order } from './api'
import './StaffScreen.css'

type StaffScreenProps = {
  busy: boolean
  loadError: string
  menu: Dish[]
  myOrders: Order[]
  onCancelOrder: (orderId: string) => void
  onNavigateToAdmin: () => void
  onNavigateToStaff: () => void
  onOpenCart: () => void
  onPlaceOrder: (dishId: string) => void
  userName: string
}

function initialsFor(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .filter((part) => /\p{L}/u.test(part))
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('')
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path d="m4 8 2.5 2.5L12 5" />
    </svg>
  )
}

function CartIcon() {
  return (
    <svg viewBox="0 0 18 18" aria-hidden="true">
      <path d="M2 3h2l1.6 8.1a1.5 1.5 0 0 0 1.5 1.2h6.2a1.5 1.5 0 0 0 1.5-1.2L16 6H5" />
      <circle cx="7.5" cy="15" r="1" />
      <circle cx="13" cy="15" r="1" />
    </svg>
  )
}

function StaffScreen({
  busy,
  loadError,
  menu,
  myOrders,
  onCancelOrder,
  onNavigateToAdmin,
  onNavigateToStaff,
  onOpenCart,
  onPlaceOrder,
  userName,
}: StaffScreenProps) {
  const [selectedMealId, setSelectedMealId] = useState('')
  const selectedMeal = menu.find((meal) => meal.id === selectedMealId)
  const canOrder = menu.length > 0 && !busy

  useEffect(() => {
    if (menu.length === 0) {
      setSelectedMealId('')
      return
    }
    if (!menu.some((meal) => meal.id === selectedMealId)) {
      setSelectedMealId(menu[0].id)
    }
  }, [menu, selectedMealId])

  return (
    <main className="staff-screen">
      <header className="staff-header">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            M
          </span>
          <span className="brand-name">MealMate</span>
        </div>
        <span className="profile-initials">{initialsFor(userName) || '—'}</span>
      </header>

      <nav className="staff-tabs" aria-label="Staff navigation">
        <button
          aria-current="page"
          className="staff-tab staff-tab-active"
          onClick={onNavigateToStaff}
          type="button"
        >
          My lunch
        </button>
        <button
          className="staff-tab"
          onClick={onNavigateToAdmin}
          type="button"
        >
          Admin
        </button>
      </nav>

      <section className="staff-content">
        <p className="staff-date">Today’s lunch</p>
        <h1>Good morning, {userName}</h1>
        <p className="staff-subtitle">Choose your lunch for today.</p>

        {loadError ? (
          <p className="staff-error" role="alert">
            {loadError}
          </p>
        ) : null}

        <div className="cutoff-notice" role="status">
          <span className="notice-check" aria-hidden="true">
            <CheckIcon />
          </span>
          <span>
            <strong>
              {menu.length > 0 ? 'Menu is live' : 'Menu unavailable'}
            </strong>
            <small>
              {menu.length > 0
                ? 'Pick a dish, place an order, or cancel from Your order.'
                : 'Today’s menu has not been published yet.'}
            </small>
          </span>
        </div>

        <div className="menu-heading">
          <h2>Today’s menu</h2>
          <button
            aria-label={`Your order, ${myOrders.length} items`}
            className="cart-count"
            onClick={onOpenCart}
            type="button"
          >
            <CartIcon />
            <span>Order</span>
            <span className="cart-badge">{myOrders.length}</span>
          </button>
        </div>

        {menu.length > 0 ? (
          <div className="meal-list" role="radiogroup" aria-label="Today’s menu">
            {menu.map((meal) => (
              <button
                aria-checked={selectedMealId === meal.id}
                className={`meal-card${selectedMealId === meal.id ? ' meal-card-selected' : ''}`}
                disabled={!canOrder}
                key={meal.id}
                onClick={() => setSelectedMealId(meal.id)}
                onKeyDown={(event) => {
                  const isPreviousKey =
                    event.key === 'ArrowLeft' || event.key === 'ArrowUp'
                  const isNextKey =
                    event.key === 'ArrowRight' || event.key === 'ArrowDown'

                  if (!isPreviousKey && !isNextKey) {
                    return
                  }

                  event.preventDefault()
                  const currentIndex = menu.findIndex(
                    (item) => item.id === selectedMealId,
                  )
                  const offset = isPreviousKey ? -1 : 1
                  const nextIndex =
                    (currentIndex + offset + menu.length) % menu.length
                  setSelectedMealId(menu[nextIndex].id)
                  event.currentTarget.parentElement
                    ?.querySelectorAll<HTMLButtonElement>('[role="radio"]')
                    [nextIndex]?.focus()
                }}
                role="radio"
                tabIndex={selectedMealId === meal.id ? 0 : -1}
                type="button"
              >
                <span
                  className={`meal-selector${selectedMealId === meal.id ? ' meal-selector-selected' : ''}`}
                  aria-hidden="true"
                >
                  {selectedMealId === meal.id && <CheckIcon />}
                </span>
                <span className="meal-copy">
                  <strong>{meal.name}</strong>
                  <small>{meal.description || 'Published dish'}</small>
                </span>
                <strong className="meal-price">
                  {formatPrice(meal.price)}
                </strong>
              </button>
            ))}
          </div>
        ) : (
          <p className="staff-empty">No dishes published yet.</p>
        )}

        <button
          className="order-button"
          disabled={!canOrder || !selectedMeal}
          onClick={() => {
            if (selectedMeal) onPlaceOrder(selectedMeal.id)
          }}
          type="button"
        >
          <span>
            {busy
              ? 'Saving…'
              : `Order ${selectedMeal?.name ?? 'meal'}`}
          </span>
          <span aria-hidden="true">→</span>
        </button>

        <section className="my-orders-card" aria-label="Your orders">
          <div className="menu-heading">
            <h2>Your order</h2>
          </div>
          {myOrders.length > 0 ? (
            <ul className="my-orders-list">
              {myOrders.map((order) => (
                <li className="my-order-item" key={order.id}>
                  <span>{order.dishName}</span>
                  <button
                    disabled={busy}
                    onClick={() => onCancelOrder(order.id)}
                    type="button"
                  >
                    Cancel
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="staff-empty">No order yet — it will survive a refresh.</p>
          )}
        </section>

        <section className="spending-card" aria-label="October spending">
          <div className="spending-topline">
            <span>October spending</span>
            <span className="lunch-count">12 lunches</span>
          </div>
          <strong className="spending-amount">$126.50</strong>
          <div
            className="spending-progress"
            role="img"
            aria-label="Monthly total, 126 dollars and 50 cents of 120 dollar budget"
          >
            <span />
          </div>
          <div className="spending-footer">
            <span>Monthly total</span>
            <span>$120 budget</span>
          </div>
        </section>
      </section>
    </main>
  )
}

export default StaffScreen

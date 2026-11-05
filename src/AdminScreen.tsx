import { useState, type FormEvent } from 'react'
import { formatPrice, type Dish, type Order } from './api'
import './AdminScreen.css'

type AdminScreenProps = {
  busy: boolean
  loadError: string
  menu: Dish[]
  onNavigateToStaff: () => void
  onSaveMenu: (menu: Dish[]) => void
  orders: Order[]
}

function slugify(name: string): string {
  const base = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  return base || `dish-${Date.now()}`
}

function AdminScreen({
  busy,
  loadError,
  menu,
  onNavigateToStaff,
  onSaveMenu,
  orders,
}: AdminScreenProps) {
  const [dishName, setDishName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('10')

  const orderCounts = menu.map((dish) => ({
    dish,
    count: orders.filter((order) => order.dishId === dish.id).length,
  }))
  const totalOrders = orders.length

  function handleAddDish(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const name = dishName.trim()
    if (!name || busy) return

    const parsedPrice = Number.parseFloat(price)
    const nextDish: Dish = {
      id: slugify(name),
      name,
      description: description.trim(),
      price: Number.isFinite(parsedPrice) ? parsedPrice : 0,
    }

    const uniqueId = menu.some((dish) => dish.id === nextDish.id)
      ? `${nextDish.id}-${Date.now()}`
      : nextDish.id

    onSaveMenu([...menu, { ...nextDish, id: uniqueId }])
    setDishName('')
    setDescription('')
    setPrice('10')
  }

  function handleDeleteDish(dishId: string) {
    if (busy) return
    onSaveMenu(menu.filter((dish) => dish.id !== dishId))
  }

  return (
    <main className="admin-screen">
      <header className="admin-header">
        <div className="admin-brand">
          <span className="admin-brand-mark" aria-hidden="true">
            M
          </span>
          <span className="admin-brand-name">MealMate</span>
        </div>
        <span className="admin-profile-initials">AD</span>
      </header>

      <nav className="admin-tabs" aria-label="Staff navigation">
        <button className="admin-tab" onClick={onNavigateToStaff} type="button">
          My lunch
        </button>
        <span aria-current="page" className="admin-tab admin-tab-active">
          Admin
        </span>
      </nav>

      <section className="admin-content">
        <p className="admin-date">Today’s lunch</p>
        <h1>Lunch admin</h1>
        <p className="admin-subtitle">
          Publish today’s menu and track orders.
        </p>

        {loadError ? (
          <p className="admin-error" role="alert">
            {loadError}
          </p>
        ) : null}

        <div className="admin-menu-heading">
          <div>
            <h2>Publish Today’s Menu</h2>
            <p>Add or delete dishes for everyone</p>
          </div>
          <span
            className={`publish-status${menu.length > 0 ? ' publish-status-live' : ''}`}
          >
            {menu.length > 0 ? 'Published' : 'Empty'}
          </span>
        </div>

        <form className="publish-form" onSubmit={handleAddDish}>
          <label>
            Dish name
            <input
              onChange={(event) => setDishName(event.target.value)}
              placeholder="e.g. Herb chicken bowl"
              required
              type="text"
              value={dishName}
            />
          </label>
          <label>
            Description
            <input
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Short description"
              type="text"
              value={description}
            />
          </label>
          <label>
            Price
            <input
              min="0"
              onChange={(event) => setPrice(event.target.value)}
              step="0.5"
              type="number"
              value={price}
            />
          </label>
          <button disabled={busy || !dishName.trim()} type="submit">
            {busy ? 'Saving…' : 'Add dish'}
            <span aria-hidden="true">→</span>
          </button>
        </form>

        <div className="admin-menu-list">
          {menu.length > 0 ? (
            menu.map((meal, index) => (
              <article className="admin-menu-item" key={meal.id}>
                <span className="menu-number">{index + 1}</span>
                <span className="admin-menu-name">{meal.name}</span>
                <span className="admin-menu-price">
                  <span aria-hidden="true">$</span>
                  {meal.price.toFixed(2).replace(/\.00$/, '')}
                </span>
                <button
                  aria-label={`Delete ${meal.name}`}
                  className="admin-delete"
                  disabled={busy}
                  onClick={() => handleDeleteDish(meal.id)}
                  type="button"
                >
                  Delete
                </button>
              </article>
            ))
          ) : (
            <p className="admin-empty">No dishes yet — add one above.</p>
          )}
        </div>

        <div className="order-summary-heading">
          <div>
            <h2>Menu</h2>
            <p>Total orders for each dish</p>
          </div>
          <strong>{totalOrders}</strong>
        </div>

        <div className="admin-order-list">
          {orderCounts.length > 0 ? (
            orderCounts.map(({ dish, count }) => (
              <article className="admin-order-item" key={dish.id}>
                <span className="order-quantity">{count}</span>
                <span className="admin-menu-name">{dish.name}</span>
                <span className="admin-menu-price">{formatPrice(dish.price)}</span>
              </article>
            ))
          ) : (
            <p className="admin-empty">Publish a menu to see dish totals.</p>
          )}
        </div>

        <div className="order-summary-heading">
          <div>
            <h2>Who ordered what</h2>
            <p>Live order details for the kitchen</p>
          </div>
        </div>

        <div className="admin-order-list">
          {orders.length > 0 ? (
            orders.map((order) => (
              <article className="admin-order-item" key={order.id}>
                <span className="order-staff">{order.staffName}</span>
                <span className="admin-menu-name">{order.dishName}</span>
              </article>
            ))
          ) : (
            <p className="admin-empty">No orders yet.</p>
          )}
        </div>
      </section>
    </main>
  )
}

export default AdminScreen

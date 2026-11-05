import { useCallback, useEffect, useState } from 'react'
import {
  cancelOrder,
  getMenu,
  getOrders,
  placeOrder,
  saveMenu,
  type Dish,
  type Order,
} from './api'
import AdminScreen from './AdminScreen'
import CartScreen from './CartScreen'
import StaffScreen from './StaffScreen'
import WelcomeScreen from './WelcomeScreen'

type Screen = 'welcome' | 'staff' | 'cart' | 'admin'

const STAFF_NAME_KEY = 'mealmate-staff-name'
const POLL_MS = 4000

function readSavedName(): string {
  try {
    return localStorage.getItem(STAFF_NAME_KEY)?.trim() ?? ''
  } catch {
    return ''
  }
}

function App() {
  const savedName = readSavedName()
  const [currentScreen, setCurrentScreen] = useState<Screen>(
    savedName ? 'staff' : 'welcome',
  )
  const [userName, setUserName] = useState(savedName)
  const [menu, setMenu] = useState<Dish[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [loadError, setLoadError] = useState('')
  const [busy, setBusy] = useState(false)

  const refresh = useCallback(async () => {
    try {
      const [nextMenu, nextOrders] = await Promise.all([getMenu(), getOrders()])
      setMenu(nextMenu)
      setOrders(nextOrders)
      setLoadError('')
    } catch (error) {
      setLoadError(
        error instanceof Error ? error.message : 'Could not load data',
      )
    }
  }, [])

  useEffect(() => {
    void refresh()
    const timer = window.setInterval(() => {
      void refresh()
    }, POLL_MS)
    return () => window.clearInterval(timer)
  }, [refresh])

  const myOrders = orders.filter((order) => order.staffName === userName)

  async function handleContinue(name: string) {
    const trimmed = name.trim()
    try {
      localStorage.setItem(STAFF_NAME_KEY, trimmed)
    } catch {
      // localStorage may be unavailable; name still works for this session
    }
    setUserName(trimmed)
    setCurrentScreen('staff')
  }

  async function handlePlaceOrder(dishId: string) {
    if (!userName || busy) return
    setBusy(true)
    try {
      await placeOrder(userName, dishId)
      await refresh()
    } catch (error) {
      setLoadError(
        error instanceof Error ? error.message : 'Could not place order',
      )
    } finally {
      setBusy(false)
    }
  }

  async function handleCancelOrder(orderId: string) {
    if (!userName || busy) return
    setBusy(true)
    try {
      await cancelOrder(orderId, userName)
      await refresh()
    } catch (error) {
      setLoadError(
        error instanceof Error ? error.message : 'Could not cancel order',
      )
    } finally {
      setBusy(false)
    }
  }

  async function handleSaveMenu(nextMenu: Dish[]) {
    if (busy) return
    setBusy(true)
    try {
      const saved = await saveMenu(nextMenu)
      setMenu(saved)
      setLoadError('')
    } catch (error) {
      setLoadError(
        error instanceof Error ? error.message : 'Could not save menu',
      )
    } finally {
      setBusy(false)
    }
  }

  if (currentScreen === 'welcome') {
    return <WelcomeScreen onContinue={handleContinue} />
  }

  if (currentScreen === 'cart') {
    return (
      <CartScreen
        busy={busy}
        loadError={loadError}
        onBack={() => setCurrentScreen('staff')}
        onCancelOrder={handleCancelOrder}
        onNavigateToAdmin={() => setCurrentScreen('admin')}
        orders={myOrders}
        userName={userName}
      />
    )
  }

  if (currentScreen === 'admin') {
    return (
      <AdminScreen
        busy={busy}
        loadError={loadError}
        menu={menu}
        onNavigateToStaff={() => setCurrentScreen('staff')}
        onSaveMenu={handleSaveMenu}
        orders={orders}
      />
    )
  }

  return (
    <StaffScreen
      busy={busy}
      loadError={loadError}
      menu={menu}
      myOrders={myOrders}
      onCancelOrder={handleCancelOrder}
      onNavigateToAdmin={() => setCurrentScreen('admin')}
      onNavigateToStaff={() => setCurrentScreen('staff')}
      onOpenCart={() => setCurrentScreen('cart')}
      onPlaceOrder={handlePlaceOrder}
      userName={userName}
    />
  )
}

export default App

export type Dish = {
  id: string
  name: string
  description: string
  price: number
}

export type Order = {
  id: string
  staffName: string
  dishId: string
  dishName: string
  createdAt: string
}

async function parseJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let message = `Request failed (${response.status})`
    try {
      const body = (await response.json()) as { error?: string }
      if (body.error) message = body.error
    } catch {
      // keep default message
    }
    throw new Error(message)
  }
  return response.json() as Promise<T>
}

export function getMenu(): Promise<Dish[]> {
  return fetch('/api/menu').then((response) => parseJson<Dish[]>(response))
}

export function saveMenu(menu: Dish[]): Promise<Dish[]> {
  return fetch('/api/menu', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(menu),
  }).then((response) => parseJson<Dish[]>(response))
}

export function getOrders(): Promise<Order[]> {
  return fetch('/api/orders').then((response) => parseJson<Order[]>(response))
}

export function placeOrder(
  staffName: string,
  dishId: string,
): Promise<Order> {
  return fetch('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ staffName, dishId }),
  }).then((response) => parseJson<Order>(response))
}

export function cancelOrder(
  orderId: string,
  staffName: string,
): Promise<{ ok: boolean }> {
  const params = new URLSearchParams({ staffName })
  return fetch(`/api/orders/${encodeURIComponent(orderId)}?${params}`, {
    method: 'DELETE',
  }).then((response) => parseJson<{ ok: boolean }>(response))
}

export function formatPrice(amount: number) {
  return `$${amount.toFixed(2)}`
}

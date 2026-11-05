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

type Env = {
  ORDERS: KVNamespace
  ASSETS: Fetcher
}

const MENU_KEY = 'menu'
const ORDERS_KEY = 'orders'

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function error(message: string, status: number): Response {
  return json({ error: message }, status)
}

async function readMenu(env: Env): Promise<Dish[]> {
  const raw = await env.ORDERS.get(MENU_KEY)
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) ? (parsed as Dish[]) : []
  } catch {
    return []
  }
}

async function readOrders(env: Env): Promise<Order[]> {
  const raw = await env.ORDERS.get(ORDERS_KEY)
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) ? (parsed as Order[]) : []
  } catch {
    return []
  }
}

function slugify(name: string): string {
  const base = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  return base || `dish-${Date.now()}`
}

async function handleApi(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url)
  const { pathname } = url
  const method = request.method.toUpperCase()

  if (pathname === '/api/menu' && method === 'GET') {
    return json(await readMenu(env))
  }

  if (pathname === '/api/menu' && method === 'PUT') {
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return error('Invalid JSON body', 400)
    }

    if (!Array.isArray(body)) {
      return error('Menu must be an array of dishes', 400)
    }

    const menu: Dish[] = []
    for (const item of body) {
      if (!item || typeof item !== 'object') {
        return error('Each dish must be an object', 400)
      }
      const dish = item as Partial<Dish>
      const name = typeof dish.name === 'string' ? dish.name.trim() : ''
      if (!name) return error('Each dish needs a name', 400)
      const description =
        typeof dish.description === 'string' ? dish.description.trim() : ''
      const price =
        typeof dish.price === 'number' && Number.isFinite(dish.price)
          ? dish.price
          : 0
      const id =
        typeof dish.id === 'string' && dish.id.trim()
          ? dish.id.trim()
          : slugify(name)
      menu.push({ id, name, description, price })
    }

    await env.ORDERS.put(MENU_KEY, JSON.stringify(menu))
    return json(menu)
  }

  if (pathname === '/api/orders' && method === 'GET') {
    return json(await readOrders(env))
  }

  if (pathname === '/api/orders' && method === 'POST') {
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return error('Invalid JSON body', 400)
    }

    if (!body || typeof body !== 'object') {
      return error('Order body must be an object', 400)
    }

    const { staffName, dishId } = body as {
      staffName?: unknown
      dishId?: unknown
    }
    const name =
      typeof staffName === 'string' ? staffName.trim() : ''
    const id = typeof dishId === 'string' ? dishId.trim() : ''
    if (!name) return error('staffName is required', 400)
    if (!id) return error('dishId is required', 400)

    const menu = await readMenu(env)
    const dish = menu.find((item) => item.id === id)
    if (!dish) return error('Dish is not on today’s menu', 400)

    const orders = await readOrders(env)
    const order: Order = {
      id: crypto.randomUUID(),
      staffName: name,
      dishId: dish.id,
      dishName: dish.name,
      createdAt: new Date().toISOString(),
    }
    orders.push(order)
    await env.ORDERS.put(ORDERS_KEY, JSON.stringify(orders))
    return json(order, 201)
  }

  const deleteMatch = pathname.match(/^\/api\/orders\/([^/]+)$/)
  if (deleteMatch && method === 'DELETE') {
    const orderId = decodeURIComponent(deleteMatch[1])
    let staffName = url.searchParams.get('staffName')?.trim() ?? ''

    if (!staffName) {
      try {
        const body = (await request.json()) as { staffName?: unknown }
        if (typeof body.staffName === 'string') {
          staffName = body.staffName.trim()
        }
      } catch {
        // no body is fine if query param was intended
      }
    }

    if (!staffName) return error('staffName is required to cancel', 400)

    const orders = await readOrders(env)
    const existing = orders.find((order) => order.id === orderId)
    if (!existing) return error('Order not found', 404)
    if (existing.staffName !== staffName) {
      return error('Only the person who placed the order may cancel it', 403)
    }

    const next = orders.filter((order) => order.id !== orderId)
    await env.ORDERS.put(ORDERS_KEY, JSON.stringify(next))
    return json({ ok: true })
  }

  return error('Not found', 404)
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    if (url.pathname.startsWith('/api/')) {
      return handleApi(request, env)
    }
    return env.ASSETS.fetch(request)
  },
}

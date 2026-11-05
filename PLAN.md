# MealMate W6 Implementation Plan

**Brief (in scope):** Staff name remembered on device; Admin publishes today's menu (add/delete dishes); staff pick a dish, order it, cancel their own order; menu and orders live in Cloudflare KV via a Worker API so reload and multi-device see the same data; Admin sees per-dish order totals and who ordered what.

## Not in this plan

- Accounts, passwords, sign-in, sessions, or roles beyond Staff/Admin screens
- Payments, wallets, receipts, or real spending totals (keep W5 fake "October spending" numbers)
- Cut-off times, demo clock, "Ordering closed", or kitchen cutoff UI
- Real-time WebSockets / SSE (use short polling instead)
- CORS libraries, retry frameworks, migrations, pagination, test suites
- Multi-dish cart quantities as a separate domain model (one order = one staff + one dish)
- Email, notifications, dish images upload, analytics

---

## Data model (KV)

Exactly two keys in the `ORDERS` KV binding:

| Key | Value (JSON) |
| --- | --- |
| `menu` | `Dish[]` — `{ id, name, description, price }` |
| `orders` | `Order[]` — `{ id, staffName, dishId, dishName, createdAt }` |

Staff name is **device-local** (`localStorage`), not stored as an account.

---

## Numbered steps

### 1. Bind Cloudflare KV `ORDERS`
- **Files:** `wrangler.jsonc`
- **Change:** Create namespace and add `kv_namespaces` with binding `ORDERS`.
- **Test:** `wrangler.jsonc` contains `binding: "ORDERS"` and a non-empty `id`.

### 2. Add Worker API entry
- **Create:** `worker/index.ts` (or `src/worker.ts` — one Worker file only)
- **Change:** `wrangler.jsonc` — set `"main"` to the Worker file; give assets a binding (`ASSETS`) with SPA not-found handling so `/api/*` is handled by the Worker and the React app is still served.
- **Routes:**
  - `GET /api/menu` → list dishes (default `[]` if missing)
  - `PUT /api/menu` → replace whole menu list (Admin publish)
  - `GET /api/orders` → list orders (default `[]`)
  - `POST /api/orders` → body `{ staffName, dishId }` appends one order; only if dish exists on menu
  - `DELETE /api/orders/:id` → remove order **only if** `staffName` query/body matches the order's `staffName`
  - All other paths → `env.ASSETS.fetch(request)`
- **Test:** After deploy (or `wrangler dev`), `GET /api/menu` returns JSON array; unknown `/api/...` returns 404 JSON.

### 3. Shared API client on the front end
- **Create:** `src/api.ts`
- **Change:** thin `fetch` helpers for the routes above; no auth headers.
- **Test:** Typecheck/build includes the file; calling helpers against a live Worker returns parsed JSON.

### 4. Remember staff name on the device
- **Change:** `src/WelcomeScreen.tsx`, `src/App.tsx`
- **Behaviour:** On Continue, save trimmed name to `localStorage`. On load, if a saved name exists, skip Welcome and open Staff with that name. Keep Welcome footer with full name + UID.
- **Test:** Enter name → Continue → refresh → still on Staff with same greeting; clearing site data shows Welcome again.

### 5. Staff: load menu, place one order, see it after refresh
- **Change:** `src/StaffScreen.tsx`, `src/App.tsx`, keep `src/meals.ts` only as types/helpers if still useful or replace callers with API dishes
- **Behaviour:** Menu comes from `GET /api/menu`. Staff selects a dish and places an order via `POST /api/orders`. Show the staff member's current order(s) on Staff (and/or Cart). Fake spending card stays as static W5 UI.
- **Test:** Admin has dishes published → Staff sees them → Order → refresh → order still listed for that name.

### 6. Staff: cancel own order only
- **Change:** `src/StaffScreen.tsx` and/or `src/CartScreen.tsx`, `src/App.tsx`
- **Behaviour:** Cancel calls `DELETE /api/orders/:id` with the current staff name. Server rejects cancel if name does not match.
- **Test:** Order as "A" → cancel succeeds. Order as "A", open as "B" (other browser / cleared name) → cannot delete A's order via API with name "B".

### 7. Admin: publish today's menu (add / delete dishes)
- **Change:** `src/AdminScreen.tsx`, `src/App.tsx`
- **Behaviour:** "Publish Today's Menu" — form to add a dish; delete control per dish; persist with `PUT /api/menu`. Remove demo clock / cutoff / hardcoded meal list and fake order counts.
- **Test:** Add dish → appears for Staff on another device/tab after refresh/poll. Delete dish → gone from Staff menu.

### 8. Admin: order totals per dish + who ordered what
- **Change:** `src/AdminScreen.tsx`
- **Behaviour:** "Menu" / order summary section shows count of orders per dish from live `GET /api/orders`. Separate section lists each order as staff + dish.
- **Test:** Two staff order different dishes → Admin shows correct counts and both detail rows.

### 9. Multi-device sync (polling)
- **Change:** `src/App.tsx` (or a small hook in `src/api.ts`)
- **Behaviour:** While Staff/Admin/Cart is open, poll menu + orders every few seconds so another device's publish/order/cancel appears without a full page reload.
- **Test:** Two browsers on the live URL; order in one → within a few seconds the other Admin view updates.

### 10. Build config so the Worker is part of the project
- **Change:** `package.json` (add `wrangler` script / dependency if needed), ensure front-end `tsc` still builds `src/**`; Worker typechecked by wrangler on deploy.
- **Note (Section 6 check):** `tsconfig.app.json` `include` is `["src"]` — keep API client under `src/`; Worker file lives under `worker/` and is built by Wrangler, not Vite.
- **Test:** `npm run build` succeeds; `npx wrangler deploy` prints the `mealmate-w6` Worker URL.

### 11. Deploy and verify checklist
- Commit message: `Worker API and KV: orders survive a reload`
- `npm run build` then `npx wrangler deploy`
- Private-browser checklist from workshop Section 7 (Admin add dish → Welcome name → Staff order → reload persists → second browser Admin sees staff+dish → cancel clears Admin).

---

## Files touched (summary)

| Action | Path |
| --- | --- |
| Create | `PLAN.md` (this file) |
| Create | `worker/index.ts` |
| Create | `src/api.ts` |
| Change | `wrangler.jsonc` |
| Change | `src/App.tsx` |
| Change | `src/WelcomeScreen.tsx` |
| Change | `src/StaffScreen.tsx` |
| Change | `src/CartScreen.tsx` |
| Change | `src/AdminScreen.tsx` |
| Change | `src/meals.ts` (types/helpers only if still needed) |
| Change | `package.json` (wrangler scripts/deps if required) |
| Possibly change | related `*.css` for Admin add/delete + order detail list |

## How success is proven

1. Live Worker URL loads the app.
2. Name survives refresh via `localStorage`.
3. Menu and orders survive refresh and match across two browsers (KV).
4. Only the ordering staff can cancel their order.
5. Admin shows per-dish totals and staff+dish details.
6. No login, payment, or cut-off features appear.

---
name: ifesquare-log-2026-08-10
description: Linear daily engineering log for 2026-08-10 on Ifesquare
---

# 2026-08-10

# Day Work — 2026-08-10

## Product search in product tables

### Products page catalog (`frontend/src/components/dashboard/ProductsCatalog.tsx`)

* Added a responsive search bar in the table header (below the title/action buttons).
* Filters by product name, composes with the existing "Low stock only" toggle.
* Clear (×) button; empty state shows `No products match "…"` when nothing is found.
* Full width on mobile, `max-w-xs` on desktop.

### History day detail (`frontend/src/components/dashboard/DayDetailPanel.tsx`)

* Added the same search bar above the per-day product table.
* Footer totals recompute to reflect only the matched products while searching.
* Empty state for zero matches.

### Already present

* Dashboard "Today's products" table (`ProductsTable.tsx`) already had a search box — left as is.

---

## Offline navigation audit

* **Allowed**: SPA page-to-page navigation offline works — the service worker precaches `index.html` + all route bundles and registers a `NavigationRoute` → `index.html`, so `/app`, `/app/products`, `/app/history` all load from cache.
* **Blocked**: hard reload / cold start offline bounced to `/login` because `GET /api/auth/me` was **not** in the Workbox runtime-cache list. On network failure `AuthProvider` set `user = null`.
* Reads (`/api/products`, `/api/ledger/today`, `/api/history`, …) were already `NetworkFirst` cached.
* Writes: adds/edits were queued via `mutateWithOffline`; **deletes/restore used plain** `api()` **and threw offline**.

---

## Full offline mode (implemented)

Goal: the app keeps working when offline for viewing data and making changes — only the actual network sync of CRUD and closing the day require an online connection.

### What changed

* `frontend/vite.config.ts` — added `/api/auth/me` to the Workbox runtime-cache regex so offline reloads keep the session (served from cache instead of failing).
* `frontend/src/lib/offlineQueue.ts`
  * `queueMutation` now returns the mutation id and accepts an optional `tempId`.
  * Added `removeMutation(id)` to cancel queued creates.
  * `replayQueue` now: rewrites queued URLs that reference offline temp ids once a single-product create resolves them to real ids; skips permanently-failing (4xx/5xx) mutations instead of blocking the whole queue; dispatches `app-data-sync` after a full flush and `app-sync-skipped` when items were dropped.
* `frontend/src/lib/api.ts` — `mutateWithOffline` kept as a thin wrapper that falls back to `queueMutation` on network errors.
* `frontend/src/components/dashboard/ProductsProvider.tsx`
  * Optimistic add (products appear immediately with temp negative ids; each create is queued individually so it can be reconciled after replay).
  * Optimistic delete / bulk delete / restore — queued via `mutateWithOffline`; deleting an offline-created product cancels its queued create instead of queueing a delete for a temp id.
  * `refresh()` no longer wipes `rows` on network failure (stale data stays visible offline).
  * Listens for `app-data-sync` to re-pull server state after the offline queue flushes.
* `frontend/src/hooks/useLedger.ts` / `useHistory.ts` — keep stale data on fetch failure and refresh after `app-data-sync`. Closing the day remains online-only (already enforced with a friendly error).
* `frontend/src/hooks/useOnline.ts` + `frontend/src/components/layout/AppLayout.tsx` — offline banner so users know changes are queued.

### Known limitations (by design)

* Closing the day requires a connection (per request).
* CSV import / template download / email summary require a connection.
* Offline edits made to a product that was created in the **same offline session** are reconciled automatically for single adds; if a permanent server rejection occurs, that mutation is dropped and a toast notes it.

---

## Manual product additions & sticky headers

### User deletion

* Deleted the user `odunayoeuniceolajubaje@gmail.com` along with all their linked database records (140 products, 4 days, 554 entries, and 273 audit logs) in a single SQL transaction.

### Manual product addition alignment

* Upgraded `NewProductForm` and `AddProductDialog` on the frontend to include `opening`, `receipts`, and `closing` inputs in the exact table column order:
  1. Product (Name)
  2. Opening
  3. Receipts
  4. Closing
  5. Price
  6. Alert at
* Updated the backend `CreateHandler` (POST `/api/products`) to handle these fields, inserting into both the `products` and `entries` tables inside a transaction.
* Synchronized default stock alert threshold to `12` across both backend and frontend.

### Sticky table headers

* Added sticky positioning to table headers (`CatalogTh`) and constrained catalog table height to `max-h-[calc(100vh-16rem)]` with overflow-y, enabling products list to scroll underneath pinned headers.

### UI Component alignment

* Replaced the remaining native `<input>` search bars on the products page and history panel with the custom shadcn-based `Input` component.
* Replaced the native `<button>` on the DashboardHeader refresh action with the custom `Button` component.

---

## Reconciliation & build fixes (session end)

The offline work overlapped with the product-form rework (opening/receipts/closing) done in the same working tree. Reconciled so the whole tree builds together:

* `ProductsProvider.tsx` `addProducts` — fixed `api()` call that passed 3 args (`method` as positional string) to the 2-arg signature; batch body `{ products: [...] }` unchanged.
* `offlineQueue.ts` — typed the URL-rewrite regex callback params (`(m: string, temp: string)`) to clear the implicit `any` TS error.
* `useHistory.ts` — moved the `app-data-sync` effect below the `refresh` useCallback (it referenced `refresh` before declaration).
* `useLedger.ts` — rethrown offline-close error now carries `{ cause: err }` (satisfies `preserve-caught-error` lint).
* `ProductsCatalog.tsx` — restored the `Input` import (the form rework switched the search bar back to the shadcn `Input` component).
* `DashboardHeader.tsx` — removed a stray `oya` typo left in the type declaration.

### Verification

* `npm run build` (tsc -b + vite + PWA) passes with 0 errors.
* Fixed cascading render linter warnings by removing synchronous `useEffect` calls in `ProductsCatalog.tsx` and `ProductsPage.tsx` that synchronized selection state when inputs/filters changed, replacing them with on-the-fly computed (`useMemo` derived) values (`visibleSelectedIds` and `visibleSelected`).
* `go build ./...` passes.
* Rotated `JWT_SECRET` in the local `backend/.env` configuration file to a new secure, random 32-byte key.
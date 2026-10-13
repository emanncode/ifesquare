---
name: ifesquare-log-2026-07-18
description: Linear daily engineering log for 2026-07-18 on Ifesquare
---

# 2026-07-18

# Day Work — 2026-07-18

## V2 Feature 3 — Month-over-Month Comparison Card

### Backend: New `internal/analytics` package

`store.go` **— Date-range math + aggregation:**

* `computeDateRanges(today)` — computes like-for-like periods:
  * Current: 1st of this month → today
  * Previous: 1st of last month → same day-of-month (capped to last real day of that month)
  * Handles year boundaries (Jan → Dec of previous year) and variable month lengths (e.g., Jul 31 vs Jun 30)
* `computeMonthlyComparison()` — single query fetching all `entries` joined to `products` where `day_date` falls in either range. Reuses `deriveLedgerRow` sales/amount logic (closing > 0 → compute, else 0). Buckets into current/previous by date-range comparison.
* Returns `revenueDeltaPct` / `unitsDeltaPct` as `null` when previous period has zero revenue/units (backend decides, not client).

`handlers.go` **— Endpoint:**

* `GET /api/analytics/monthly-comparison` — cached under `analytics:monthly-comparison:{today}` with default 60s TTL. Key naturally busts daily.

**Route registration** in `cmd/server/main.go` under the auth middleware group.

### Backend: Cache invalidation

* `UpdateTodayEntryHandler` — also invalidates `analytics:monthly-comparison:{today}`
* `UpdateEntryHandler` — also invalidates `analytics:monthly-comparison:{today}`
* `CloseHandler` — also invalidates `analytics:monthly-comparison:{today}`

### Frontend: `MonthComparisonCard.tsx`

* Full-width card, `sm:grid-cols-2` split: Revenue | Units
* Uses `AnimatedNumber` (from F2) for each big number — deliberate reuse
* Delta pill: green with `<ArrowUp />` for positive, muted with `<ArrowDown />` for negative, or "New — no prior data to compare" when `deltaPct` is `null`
* Date range caption: "Jul 1–17 vs Jun 1–17" format via `shortDateRange()`
* No sparklines or extra charts

### Frontend: Dashboard placement

* Flow: metric cards → MonthComparisonCard → ProductsTable → InsightsCard
* Fetched on mount and on manual refresh, silently fails (non-critical)

## Follow-up Fixes

### Low stock: use total when no closing

* `ledger/store.go` — when no closing exists, `currentStock = opening + receipts` instead of 0, and `isLowStock` checked against that (was always false before)

### History day detail includes low stock fields

* `history/store.go` — `GetByDate` now queries `p.low_stock_threshold` and computes `effectiveThreshold`, `currentStock`, `isLowStock` per entry (same logic as today's ledger)
* `history/handlers.go` — response JSON includes `effective_threshold`, `current_stock`, `is_low_stock` in each entry object
* Exposed `ledger.DefaultThreshold()` getter so history can read the same global default

### Placeholder "—" instead of "0" on empty numeric inputs

* `HistoryEditableTd` — default `placeholder` changed from `"0"` to `"—"`
* `CatalogNumericTd` — same change
* `AddProductDialog.tsx` — stock and price `NumericInput`s use `placeholder="—"` instead of `"0"`

### ProductsTable: top 8 by revenue

* Dashboard "Today's products" table now shows only the top 8 products by revenue (amount), sorted descending
* Search filters the full set then limits to top 8 matching
* Grand total footer remains full-day figure

## V2 Feature 4 — Offline / PWA Support

### Packages installed

* `vite-plugin-pwa` (Workbox generateSW mode) — service worker, manifest, runtime caching
* `idb` — promise wrapper for IndexedDB

### PWA config (`vite.config.ts`)

* Manifest: name, theme color `#009B4D`, standalone display, 3 icons (192/512/maskable)
* `NetworkFirst` runtime caching for `GET /api/(products|ledger/today|history)(/.*)?$` with 3s timeout — fresh data when online, cached fallback when offline
* Auth endpoints explicitly excluded from caching

### Offline queue (`lib/offlineQueue.ts`)

* IndexedDB-backed mutation queue via `idb` (`ifesquare-offline` DB, `pending-mutations` store)
* `queueMutation(url, method, body)` — deep-copies body, stores with UUID + timestamp, dispatches `pending-sync-change` custom event
* `replayQueue()` — fetches all pending mutations in order, replays each, deletes on success, stops on network error or server error
* `getPendingCount()` / `getPendingMutations()` for UI

### Wire into API client (`lib/api.ts`)

* New `mutateWithOffline<T>()` — wraps `api()`, on network error (fetch throws) queues the mutation and returns `null`; server errors (4xx/5xx) still throw as `ApiError`

### Mutation call sites updated

* `ProductsProvider.tsx` — all PATCH calls (opening, receipts, closing, price, name, unit, low_stock_threshold) and POST calls (add product, add products) use `mutateWithOffline`; only refresh from server when the call succeeded
* `HistoryPage.tsx` — `patchEntry` uses `mutateWithOffline`; skips detail refresh when queued offline

### Online replay

* `App.tsx` — `<OfflineReplay />` calls `replayQueue()` on mount and adds `window.addEventListener("online", replayQueue)`

### Close-day blocking

* `useLedger.ts` closeDay — detects `TypeError` (network failure), throws "Can't close the day while offline — reconnect and try again." instead of silently queuing

### UI: pending sync indicator

* `hooks/usePendingSync.ts` — reactive hook listening to `pending-sync-change` custom event, returns pending mutation count
* `Sidebar.tsx` — amber pill with pulsing dot showing "N changes pending sync", visible only when count > 0

## Cleanup

### Pre-existing TS errors fixed

* `ProductsCatalog.tsx` — removed unused `formatWithCommas` import; removed `align: "center"` (not in type); removed `productId` prop from `AlertAtInput` (not in props type)
* `Sidebar.tsx` — removed unused `Wifi`/`WifiOff` imports
* `DashboardPage.tsx` — removed unused `fmtInt` import
* `HistoryPage.tsx` — removed unused `api` import (after switching to `mutateWithOffline`)

### CORS fix

* `main.go` — added `http://localhost:4173` to allowed origins (default `vite preview` port)

## Commits

| Hash | Message |
| -- | -- |
| `bf36f90` | V2 F3: analytics backend — monthly comparison endpoint + cache invalidation |
| `0d17565` | V2 F3: MonthComparisonCard — frontend component + dashboard placement |
| `0cea4b6` | fix: low stock computed from total when no closing; history day detail includes low stock fields |
| `043176c` | fix: numeric input placeholders show — instead of 0 when empty |
| `9f8c5f3` | fix: ProductsTable shows top 8 products by revenue |
| `6f19d10` | V2 F4: PWA config — vite-plugin-pwa with manifest + NetworkFirst caching |
| `13e3a9c` | V2 F4: offline queue — IndexedDB mutation queue + mutateWithOffline in api client |
| `45ae2a1` | V2 F4: wire mutateWithOffline into mutation call sites + close-day blocking |
| `e53741e` | V2 F4: pending-sync indicator in Sidebar + online replay on mount |
| `f45fc2b` | fix: resolve pre-existing TS errors (unused imports, type mismatches) |
| `6c816a3` | fix: add vite preview port 4173 to CORS allowed origins |

## V2 Feature 5 — Daily SMS Notification

### Migration

* `004_notifications.sql` — adds `phone_number` (nullable TEXT) and `notify_on_close` (default 0) to `users`

### Backend: `internal/notify/termii.go`

* `SendSMS(phone, message)` — POST to `https://api.ng.termii.com/api/sms/send` with Termii API key + sender ID
* Reads `TERMII_API_KEY` and `TERMII_SENDER_ID` env vars

### Auth handlers

* `GET /api/auth/me` — now returns `phone_number` and `notify_on_close`
* `PATCH /api/auth/me` — accepts `{ phone_number, notify_on_close }` (each optional, empty clears phone)
* Registered in `main.go`

### CloseHandler: fire-and-forget SMS

* After successful CloseDay, queries user's phone/nofify_on_close prefs
* Computes totalRevenue, totalUnits, topProduct, lowStockCount from closed-day entries
* Builds ~1-segment SMS: `"Ifesquare: Fri 17 Jul closed. Revenue ₦1,113k, 75 units sold. Top: Mobile Super 5L. 3 items low on stock."`
* Sends via `notify.SendSMS` in goroutine — failures go to Sentry, never block the response

### Frontend: Account settings dialog (Sidebar)

* Email in sidebar footer is now a clickable button that opens a Dialog
* Phone number input (`type="tel"`)
* Toggle switch: "Text me a summary when I close the day"
* Save calls `PATCH /api/auth/me`
* `User` type updated with `phone_number` and `notify_on_close`

## Database wiped — all users removed

* `backend/ifesquare.db` was deleted entirely — all accounts (olajubajeife, odunayo, etc.) and all data are gone
* On next backend start, migrations recreate an empty schema with `user_id` columns
* Fresh accounts must be created via `go run ./cmd/server --create-user <email>`

## Multi-User — Data Isolation by user_id

### Schema

* `001_init.sql` — products, days, entries now created with `user_id` from the start
* `005_multi_user.sql` — upgrades existing databases (ALTER + table recreation, migrates existing data to first user)

### All backend stores scoped by user_id

Every query/insert/update on products, entries, days tables now includes `AND user_id = ?` or inserts with `user_id`:

* `products/store.go` — List, Create, Get, Update, Archive
* `ledger/store.go` — GetTodayEntries, UpdateEntry, getEntry, autoSyncFromLastClosed, SyncFromLastClosedDay, CloseDay, ensureEntries
* `history/store.go` — ListClosedDays, GetByDate
* `analytics/store.go` — computeMonthlyComparison

### Cache keys prefixed with userID

All cache keys (products, ledger/today, history, analytics) prepend `userID:` — e.g. `42:/api/products` — to prevent cross-user cache leaks.

### Preload removed

Global cache preload at startup was removed (no user context). Cache populates on first request per user.

### Auth flow unchanged

Frontend already sends JWT cookie with `credentials: "include"`; middleware extracts `userID` from claims and sets it in request context.

## Dropped `unit` Column

### Schema

* `001_init.sql` — no longer includes `unit` in products table
* `006_drop_unit.sql` — recreates products table without `unit` column, migrates data

### Backend

* `Product` struct — removed `Unit` field
* `EntryWithProduct` struct — removed `ProductUnit` field
* All SQL queries — removed `p.unit` from SELECT lists
* All handler structs — removed `Unit` from JSON tags
* Products allowed-fields map — removed `"unit"`

### Frontend

* Types — `ApiProduct.unit`, `ApiLedgerEntry.product_unit`, `LedgerRow.unit`, `CatalogRow.unit`, `NewProductForm.unit`, `Product.unit` — all removed
* `merge()` in ProductsProvider — no longer maps `unit`
* `addProduct()` / `addProducts()` — no longer send `unit` in body
* `patchCatalogField()` — no longer handles `"unit"` field
* `AddProductDialog` — Unit input removed (Stock/Price/Alert in 3-column grid)
* `ProductsCatalog` — "Unit" column removed from sortable columns and table body
* `ProductsTable` — search no longer filters by unit; unit display removed from name cell
* `DayDetailPanel` — `product_unit` span removed
* Empty form default — `unit: ""` removed

## CSV Import / Template

### Backend

* `GET /api/products/template` — returns CSV with headers `name,price,stock` as download
* `POST /api/products/import` — accepts raw CSV body, parses, creates products, returns `{ created, errors? }`
* Routes registered in `main.go`

### Frontend

* `ProductsPage.tsx` — "Template" button downloads CSV; "Import CSV" button opens file picker, reads CSV, posts to backend, shows toast with result

## Every file changed — detailed

### New files

| File | Purpose |
| -- | -- |
| `backend/internal/notify/termii.go` | `SendSMS()` — Termii API wrapper, reads TERMII_API_KEY + TERMII_SENDER_ID env vars |
| `backend/internal/db/migrations/004_notifications.sql` | ALTER TABLE users ADD phone_number, notify_on_close |
| `backend/internal/db/migrations/005_multi_user.sql` | ADD user_id to products, recreate days/entries with user_id in PK/UNIQUE, migrate existing data |
| `backend/internal/db/migrations/006_drop_unit.sql` | Recreate products table without unit column, migrate data |

### Backend — modified files

`backend/cmd/server/main.go`

* Added `PATCH /api/auth/me` route (auth.UpdateMe)
* Added `GET /api/products/template` route (products.TemplateHandler)
* Added `POST /api/products/import` route (products.ImportHandler)
* Removed global cache preload goroutine (no user context at startup)
* Removed `cache` import (no longer used)

`backend/internal/db/db.go`

* Added 004_notifications.sql, 005_multi_user.sql, 006_drop_unit.sql to migration list
* Made duplicate-column error handling generic (any ALTER TABLE migration, not just 003)

`backend/internal/auth/handlers.go`

* `userResp` struct — added `PhoneNumber *string` and `NotifyOnClose bool`
* `Me()` — queries phone_number, notify_on_close; returns them in response
* `UpdateMe()` — new handler, accepts `{ phone_number, notify_on_close }`, each optional, empty clears phone
* Removed unused `time` import

`backend/internal/products/store.go`

* `List(userID)` — added `AND user_id = ?`
* `Create(userID, ...)` — added user_id param, inserts with user_id
* `Get(id, userID)` — added user_id param, `AND user_id = ?`
* `Update(id, userID, ...)` — added user_id param, `AND user_id = ?`, checks RowsAffected for not-found
* `Archive(id, userID)` — added user_id param, `AND user_id = ?`, checks RowsAffected
* Removed `Unit` from Product struct, all SQL SELECT/INSERT, all Scan args

`backend/internal/products/handlers.go`

* Every handler extracts `userID := r.Context().Value(auth.UserIDKey).(int64)`
* Cache keys prefixed with `userID:` via local `cacheKey(userID, key)` helper
* Removed `Unit` from batch-create and single-create anonymous structs
* Removed `"unit"` from allowed fields map in UpdateHandler
* All `Create()` calls drop the unit argument
* `TemplateHandler` — returns CSV with headers `name,price,stock`
* `ImportHandler` — parses CSV body, validates header, creates products row by row, returns `{ created, errors? }`

`backend/internal/ledger/store.go`

* Every function takes `userID int64` — GetTodayEntries, UpdateEntry, getEntry, autoSyncFromLastClosed, SyncFromLastClosedDay, CloseDay, ensureEntries
* All SQL queries add `AND user_id = ?` or `user_id` in INSERT VALUES
* Removed `ProductUnit` from `EntryWithProduct` struct
* Removed `p.unit` from all SELECT queries, removed ProductUnit from Scan

`backend/internal/ledger/handlers.go`

* Every handler extracts userID from context
* Cache keys prefixed with `userID:`
* `CloseHandler` — after successful close, fires `sendCloseNotification(userID, today)` goroutine
* `sendCloseNotification` — queries user prefs, computes summary from entries (revenue, units, top product, low stock count), builds SMS, calls notify.SendSMS, failures to Sentry
* `buildSummaryMessage` — formats date as "Mon 2 Jan", revenue in thousands, appends low stock count if > 0
* New imports: `database/sql`, `fmt`, `math`, `sentry-go`, `auth`, `db`, `notify`

`backend/internal/history/store.go`

* `ListClosedDays(limit, userID)` — added user_id filter: `AND d.user_id = ?` and `AND e.user_id = d.user_id` in JOIN
* `GetByDate(date, userID)` — added `AND e.user_id = ?`
* Removed `p.unit` from SELECT, removed ProductUnit from Scan

`backend/internal/history/handlers.go`

* Every handler extracts userID from context
* Cache keys prefixed with `userID:`
* Removed `product_unit` from day-detail response JSON map

`backend/internal/analytics/store.go`

* `computeMonthlyComparison(..., userID)` — added `AND e.user_id = ?`
* Removed `p.unit` from SELECT, removed ProductUnit from anonymous struct and Scan

`backend/internal/analytics/handlers.go`

* `MonthlyComparisonHandler` — extracts userID from context, prefixes cache key with userID

### Frontend — modified files

`frontend/src/lib/types.ts`

* `User` — added `phone_number: string | null` and `notify_on_close: boolean`
* `ApiProduct` — removed `unit: string`
* `ApiLedgerEntry` — removed `product_unit: string`
* `LedgerRow` — removed `unit: string`
* `deriveLedgerRow()` — removed `unit: e.product_unit`

`frontend/src/components/dashboard/types.ts`

* `Product` — removed `unit: string`
* `CatalogRow` — removed `unit: string`
* `NewProductForm` — removed `unit?: string`

`frontend/src/components/dashboard/productsContext.ts`

* `emptyForm` — removed `unit: ""`
* `patchCatalogField` type — removed `"unit"` from union

`frontend/src/components/dashboard/ProductsProvider.tsx`

* `merge()` — removed `unit: p.unit` from return
* `addProduct()` — removed `unit: form.unit?.trim() || ""` from body
* `addProducts()` — removed `unit: f.unit?.trim() || ""` from body
* `patchCatalogField` — removed `"unit"` from field type union
* Optimistic update — removed `else if (field === "unit") next.unit = value`
* PATCH branch (`else`) — simplified to `else if (field === "name")` (unit was only other option)

`frontend/src/components/dashboard/AddProductDialog.tsx`

* Unit input/Label removed entirely (was Stock, Unit, Price, Alert → now Stock, Price, Alert in 3-column grid)
* Submit handler — destructuring no longer extracts `unit`

`frontend/src/components/dashboard/ProductsCatalog.tsx`

* `Field` type — removed `"unit"`
* `SORTABLE_COLUMNS` — removed Unit column entry
* Table body — removed `<CatalogEditableTextTd>` for unit editing
* Removed unused `CatalogEditableTextTd` import

`frontend/src/components/dashboard/ProductsTable.tsx`

* Search filter — removed `|| r.unit.toLowerCase().includes(q)` (name-only search now)
* Name cell — removed `{r.unit}` span, inlined LowStock badge next to name

`frontend/src/components/dashboard/DayDetailPanel.tsx`

* Product name cell — removed `{e.product_unit}` subtitle span

`frontend/src/components/dashboard/Sidebar.tsx`

* Added Account Settings dialog (Dialog + DialogTrigger wrapping the email)
* Email is now a clickable button with Settings icon, opens dialog
* Dialog has phone number input + toggle switch for notify_on_close
* Save calls `PATCH /api/auth/me`
* Added `useState` for settings dialog state, `useEffect` to sync from user
* New imports: `Settings`, Dialog components, Input, Label, api, User type

`frontend/src/pages/ProductsPage.tsx`

* Added "Template" button — creates hidden anchor, triggers download of `/api/products/template`
* Added "Import CSV" button — opens hidden file input, reads file, POSTs to `/api/products/import` with Content-Type text/csv, shows toast with `{ created, errors? }`
* New imports: `useRef`, `useState`, `Download`, `Upload`, `Loader2`, `api`, `useToast`

## Commits

| Hash | Message |
| -- | -- |
| `8a8e127` | V2 F5: notification backend — Termii SMS, migration for phone/nofify_on_close |
| `c0aacb4` | V2 F5: phone/nofify_on_close in /me, PATCH /me, SMS on close, account settings dialog |
| `a8641a6` | multi-user: add user_id to products/days/entries schema |
| `d68bc10` | multi-user + drop unit: scope products by user_id, remove unit field |
| `faa23a9` | multi-user + drop unit: scope ledger by user_id, remove product_unit |
| `865708e` | multi-user + drop unit: scope history by user_id, remove p.unit from queries |
| `36d30ca` | multi-user + drop unit: scope analytics by user_id, remove p.unit from query |
| `2c9f308` | drop unit: migration to remove unit column from products |
| `731366f` | drop unit: remove unit from frontend types and context |
| `f8f6229` | drop unit: remove unit from frontend components (AddProductDialog, ProductsTable, ProductsCatalog, DayDetailPanel, ProductsProvider) |
| `5a88f09` | CSV: template download and CSV import on Products page |

---

## Soldbay Web — Landing Page Polish

### Shadcn theming

* `globals.css` — added full shadcn theme tokens (`background`, `foreground`, `primary`, `secondary`, `muted`, `accent`, `destructive`, `card`, `popover`, `border`, `input`, `ring`, `radius`) mapped to existing design colors
* `layout.tsx` — updated font configuration

### UI components

* `button.tsx` — updated to match shadcn radix-luma style with CVA variants
* `badge.tsx` — new shadcn badge component
* `separator.tsx` — new shadcn separator component

### Layout components

* `hero.tsx` — sliding pill toggle (Start shopping / Start selling) with plain div accent slide on hover
* `cta.tsx` — converted to same sliding toggle pattern as hero
* `header.tsx` — uses shadcn Button, scroll-based appearance
* `features.tsx`, `how-it-works.tsx`, `footer.tsx` — converted to shadcn color tokens

### Commits

| Hash | Message |
| -- | -- |
| `92c9746` | feat: configure shadcn theme tokens and update root layout with fonts |
| `68308a2` | feat: add shadcn UI components (button, badge, separator) |
| `f7956f9` | refactor: convert landing page components to shadcn styling with sliding toggle buttons |
| `31f8767` | chore: replace default Next.js assets with project logos and favicon |

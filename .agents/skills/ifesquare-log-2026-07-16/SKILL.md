---
name: ifesquare-log-2026-07-16
description: Linear daily engineering log for 2026-07-16 on Ifesquare
---

# 2026-07-16

# Day Work — 2026-07-16

## Performance Optimizations

* **MaxOpenConns 1→10, MaxIdleConns 1→10** in `backend/internal/db/db.go` — Turso connection pool tuned to prevent request queuing.
* **Auth revocation cache** (30s TTL) in `backend/internal/auth/auth.go` — eliminates one DB round-trip per authenticated request.
* **Batched GetTodayEntries** — 5+ sequential SQL statements collapsed into a single transaction in `backend/internal/ledger/store.go`.
* **In-memory response cache** (`backend/internal/cache/cache.go`) — pre-serialized JSON cache with 30s TTL, startup pre-load, and write-invalidation for `GET /api/products` and `GET /api/ledger/today`. Sub-millisecond reads on hit.

## UI Fix

* **Chart height fix** in `InsightsCard.tsx` — replaced invalid Tailwind classes `h-88` and `sm:h-[104]` with `h-[22rem]` and `sm:h-[26rem]`.

## Reliability & Ops

* **React ErrorBoundary** (`frontend/src/components/ErrorBoundary.tsx`) — wraps `<App />` in `App.tsx`. Catches runtime errors, shows branded fallback UI with reload button, forwards to Sentry if available.
* **Sentry integration** — Frontend (`@sentry/react` in `main.tsx`, reads `VITE_SENTRY_DSN`) + Backend (`sentry-go` in `main.go`, reads `SENTRY_DSN`). Both env-var gated (no DSN set yet).
* **Automated DB backups** — `scripts/backup-db.sh` (Turso `.dump` + gzip + rotate 30) + `.github/workflows/backup.yml` (daily 06:00 UTC, artifact 30-day retention).
* **Test scaffolding** — Frontend (Vitest + Testing Library + jsdom, `npm test`) and Backend (Go `testing`, `go test ./...`). 4 frontend tests, 7 backend tests, all passing.

## Data Integrity Gaps (2026-07-16 follow-up)

### Server-side Input Validation

* **Products** (`products/handlers.go`):
  * `CreateHandler`: validates name/unit non-empty, price >= 0, stock >= 0 (single + bulk)
  * `UpdateHandler`: validates name non-empty, price >= 0, stock >= 0 via `toFloat()` helper
* **Ledger** (`ledger/handlers.go`):
  * `UpdateTodayEntryHandler`: receipts >= 0, closing >= 0, closing <= total (opening + receipts)
  * `UpdateEntryHandler` (history edits): opening >= 0, receipts >= 0, closing >= 0, price >= 0, closing <= total

### Sync-from-last-closed Conflict Guard

* `SyncFromLastClosedDay` now checks if today has any entries with non-zero receipts or non-null closing before proceeding
* Returns `"today already has entries with data; sync only works on a fresh day"` — prevents silent overwrite of user-entered openings
* Auto-sync (`autoSyncFromLastClosed`) unaffected — runs only on first page load (`hadEntries == 0`) when no user data exists

### CSV Export of History

* New endpoint `GET /api/history/export` — returns CSV with columns: Date, Product, Unit, Opening, Receipts, Total, Closing, Sales, Price (NGN), Amount (NGN)
* Iterates all closed days (up to 9999), outputs one row per entry per day
* "Export CSV" button in HistoryPage header — triggers direct download via `<a>` tag

## Security & Auth (2026-07-16 third batch)

### Rate Limiting on Login

* **In-memory rate limiter** (`backend/internal/auth/ratelimit.go`) — 5 failed attempts per email per 15-minute sliding window
* Returns `429 Too Many Requests` with `Retry-After` header when locked out
* Counter resets on successful login
* Login now returns generic `"invalid credentials"` error (no `wrong_email` / `wrong_password` distinction) to prevent user enumeration

### Password Change / Reset

* `POST /api/auth/change-password` (authenticated) — requires `old_password` and `new_password` (min 6 chars), validates old password before updating
* `--reset-password <email>` CLI flag — prompts for a new password and updates it directly in the DB. Runbook: `go run . --reset-password mum@example.com`
* `--create-user` flag remains for initial user creation

### CSRF

* Cookie `Secure` flag is now auto-set: `true` when `APP_ENV=production` or when request is over TLS (`r.TLS != nil`), `false` otherwise (dev over HTTP)
* All cookie setters (Login, Logout, middleware revocation) use the same `secure` logic
* SameSite=Lax already in place — no change needed
* Non-mutating endpoints unaffected

## Commits (today's second batch)

| Hash | Message |
| -- | -- |
| `fc82c0f` | feat: add server-side input validation for products and ledger endpoints |
| `96ceb2e` | fix: add conflict guard to sync-from-last-closed — reject if today has data |
| `8d2aff4` | feat: add CSV export of history (backend endpoint + frontend download button) |

## Commits (third batch)

| Hash | Message |
| -- | -- |
| `995ed07` | feat: add login rate limiting (5 attempts / 15 min), generic auth errors, cookie Secure flag |
| `ae64629` | feat: add --reset-password CLI flag and /api/auth/change-password endpoint |

## Commits (fourth batch)

| Hash | Message |
| -- | -- |
| `04ef5b3` | refactor: per-day CSV export with table-matching columns and total row |

## Per-Day CSV Export (follow-up)

* Export changed from all-days bulk CSV to **per-day** — button appears in the day detail panel header, next to the date
* Columns now match the product table exactly: Product, Opening, Receipts, Total, Closing, Sales, Price, Amount
* Includes a **Total row** at the bottom (units sold + total revenue)
* Route changed from `GET /api/history/export` to `GET /api/history/{date}/export`
* File name: `ifesquare-{date}.csv`

## UX Improvements

### Auto-Comma Formatting on Numeric Inputs

* `CatalogNumericTd`: all inline numeric cells (price, stock, receipts, closing) format with commas as you type
* `HistoryEditableTd`: same auto-comma on history edit cells (opening, receipts, closing, price)
* `AddProductDialog`: stock and price inputs in the add dialog also auto-format
* Uses `Number(digits).toLocaleString("en-NG")` for formatting, `stripNonDigits()` before sending to API
* `parseCommaInt` already handled stripping commas on the receiving end — no backend changes needed

### Sortable Product Table Columns

* All 9 data columns in the Products table are clickable to sort ascending / descending
* Active column shows filled arrow (up or down); inactive columns show a muted up-down icon
* Text columns sort alphabetically (Product, Unit); numeric columns sort numerically (all others)
* Default sort: Product name ascending

### 4-Column Grid Add Product Dialog

* Dialog redesigned from vertical stack to **4-column CSS grid**
* Starts with **4 empty product cards**
* Each card is compact: Name (full width), then Unit | Stock | Price in a row
* "Add another product" adds one more card — fills the next grid slot, wraps to a new row when full
* **Max 16 products** per entry — add button disappears at the limit
* Dialog width increased from `max-w-5xl` to `max-w-7xl`

## Commits (fourth batch)

| Hash | Message |
| -- | -- |
| `04ef5b3` | refactor: per-day CSV export with table-matching columns and total row |

## Commits (fifth batch)

| Hash | Message |
| -- | -- |
| `9bbdc28` | feat: auto-comma formatting on numeric inputs as you type |
| `d2aa8d3` | feat: 4-column grid product add dialog, start with 4, max 16 |
| `75d68f3` | feat: sortable table columns with asc/desc toggle arrows |

## Component Splitting

* **All files now have one component per file** — no more multiple function components in a single file
* `DayDetailPanel` + `formatDate` extracted from `HistoryPage.tsx` → `DayDetailPanel.tsx`
* `NumericInput` extracted from `AddProductDialog.tsx` → `NumericInput.tsx`
* `AuthProvider` split from `useAuth.ts` → `AuthProvider.tsx`
* `ThemeProvider` split from `useTheme.ts` → `ThemeProvider.tsx`
* `formatDate` moved to `format.ts` so `DayDetailPanel.tsx` only exports components (Fast Refresh compatibility)

## Mobile Layout Fixes

* **Metric cards** on Dashboard: `grid grid-cols-1` → `flex flex-col` on mobile, keeps 3-column grid on `sm:`
* **Day detail** on History: side panel replaced with a Dialog overlay on mobile (`lg:hidden`), unchanged on desktop (`hidden lg:block`)

## Pie Chart Visual

* Removed `paddingAngle={2}` → `paddingAngle={0}` so slices touch
* Colors now fade smoothly from green (hsl 150) to blue (hsl 210) across slices instead of cycling 4 discrete colors

## Mobile Dialog Fix

* Day detail dialog now only renders below `lg` breakpoint via `useBelow` hook (was appearing on desktop because Radix portals to `<body>`)
* Removed unused `pieColors` destructure that caused build error

## Unit Optional

* `NewProductForm.unit` changed from required to optional (`unit?: string`)
* Backend no longer validates unit as required (only name required)
* ProductsProvider defaults empty unit to `""` instead of `"unit"`
* `AddProductDialog` uses `value={row.unit ?? ""}` for safety

## Product Catalog / Dashboard Sync

* **Root cause**: Catalog used `products.stock`/`products.price` (live), Dashboard used `entries.opening`/`entries.price` (snapshotted). Editing opening/price in Catalog only wrote to `products` table, causing drift.
* **Merge fix**: `merge()` now uses `e?.opening ?? p.stock` and `e?.price ?? p.price` — Catalog reads from today's entries first
* **Patch fix**: editing "opening" or "price" in Catalog now PATCHes **both** the entry (`/api/ledger/today/{id}`) and the product (`/api/products/{id}`)
* **Backend**: `UpdateTodayEntryHandler` now accepts `opening` and `price` fields (was only `receipts`/`closing`)

## Commits

| Hash | Message |
| -- | -- |
| `7cd8df0` | extract DayDetailPanel from HistoryPage into own file |
| `b72028a` | extract NumericInput from AddProductDialog into own file |
| `a77f20f` | split useAuth: move AuthProvider to components/AuthProvider |
| `a120215` | split useTheme: move ThemeProvider to components/ThemeProvider |
| `9e1ca3d` | move formatDate to format.ts for Fast Refresh compatibility |
| `cee22a9` | close pie slice gaps and fade colors from green to blue |
| `773ed6e` | only render day detail dialog below lg breakpoint; remove unused pieColors destructure |
| `4ad0bb9` | make unit optional in product form and backend |
| `52a79ba` | add opening and price fields to UpdateTodayEntryHandler; sync Catalog with Dashboard |

## Docs

* Updated `full_on_feature.md` — added Input Validation, CSV Export, Sync Guard, Rate Limiting, Password Reset, and CSRF sections; bumped API endpoint count to 16.
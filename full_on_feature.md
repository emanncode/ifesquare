# Ifesquare — Full Feature Overview

Ifesquare is a shop inventory and daily ledger management system with a Go backend and React frontend — built to replace handwritten stock ledgers for small retail shops.

---

## Core Concepts

Each day has a **ledger** — a snapshot of every product's opening stock, receipts (new stock added), closing stock (what's left at end of day), and computed sales & revenue. Days can be **closed** to lock the numbers and update product stock for the next day.

The app supports **two roles**: **Owner** (full access — products, history, settings, analytics) and **Staff** (restricted view — current day only, no prices, no charts, no close-day, no history).

---

## Pages & What They Do

### 1. Coming Soon (`/`)
- Public landing page with brand introduction and green petrol-station theme
- Four feature cards: Daily stock ledger, Auto-calculated sales, Charts, Products & stock
- Email waitlist signup (client-side mock)
- Mini dashboard preview with sample data + "How a day works" steps
- Dark/light theme toggle
- No auth required

### 2. Login (`/login`)
- Email + password sign-in (show/hide password toggle)
- JWT stored in httpOnly cookie (72h TTL)
- Error messages: `wrong_email`, `wrong_password`, network errors, rate limiting (429)
- Dark/light theme toggle
- Brandmark component (shared with Coming Soon and Sidebar)
- Redirects to `/app` on success, hides for authenticated users

### 3. Dashboard — Today's Ledger (`/app`)
- **Owner view**: Full product table with columns **Product | Opening | Receipts | Total | Closing | Sales | Price | Amount**
  - Closing=0 treated same as null — shows "—" and no sales calculated (closing must be > 0 to count)
- **Staff view**: Only Units Sold + Low Stock metric cards. Product table hides Price/Amount columns. No charts. No close button.
- Metric cards: Today's Revenue (with sparkline), Units Sold, Top Product, Low Stock count
- **Insights card** with three chart tabs (Recharts):
  - **Bar chart** — Revenue per product
  - **Pie chart** — Revenue share per product (slices touch, colors fade green→blue)
  - **Line chart** — Weekly revenue trend (mock data for future days)
- **Month-over-Month Comparison Card** — revenue + units compared to previous month with delta % (up/down arrows)
- **Close & save day** button with confirmation dialog — locks today, auto-fills null closings, updates stock, archives to history, sends SMS if configured
- **Refresh button** — re-fetches today's ledger
- All numbers display with comma formatting (e.g., ₦1,500)

### 4. Products (`/app/products`) — Owner only
Full editable catalog merged with today's ledger entries:
- **Product** – inline text edit (PATCH `/api/products/{id}`)
- **Opening** – inline number edit (PATCH both `/api/products/{id}` stock and `/api/ledger/today/{productId}` opening)
- **Receipts** – inline number edit (PATCH `/api/ledger/today/{productId}`)
- **Total** – computed (opening + receipts) — read-only
- **Closing** – inline number edit (PATCH `/api/ledger/today/{productId}`)
- **Sales** – computed (total − closing, only when closing > 0) — read-only
- **Price** – inline number edit (PATCH both `/api/products/{id}` and `/api/ledger/today/{productId}` price)
- **Amount** – computed (sales × price) — read-only
- **Low Stock Alert** – inline number edit (PATCH `/api/products/{id}`), amber badge in sidebar
- **Search** — filter products by name
- **Sort** — sort by any column, toggle asc/desc
- **Low stock filter** — toggle to show only products below threshold
- **Trash** – archive product (DELETE `/api/products/{id}`)
- **+ Add products** — multi-row dialog to add up to 16 products at once
- **CSV Import** — upload CSV file (name,price,stock) with template download
- **Debounced saving** — 500ms debounce on inline edits, optimistic local update
- **Offline queue** — mutations queued in IndexedDB when offline, replayed on reconnect
- **Auto-sync at 2 AM rollover** — when the page loads on a new day (rolling over at 2 AM instead of midnight), the most recent closed day's closing values are automatically copied into today's opening values (and product stock). No manual sync needed.

### 5. History (`/app/history`) — Owner only
- **Left panel**: List of closed days with date, closing time, total revenue & units, sorted by date descending
- **Right panel**: Day detail (click to open/collapse) — shown as a bottom-sheet dialog on mobile, side panel on desktop
- **For past days** — Opening, Receipts, Closing, Price are inline editable (PATCH `/api/ledger/{date}/{productId}`) with 500ms debounce
- **For today** (if already closed) — read-only with link to Products page
- **Computed fields** — Total, Sales, Amount are calculated on read, never stored
- **CSV export** — "Export" button in the day detail panel downloads that day's entries as a CSV file (Product to Amount columns, with total row)
- All numbers display with comma formatting

### 6. Settings (`/app/settings`) — Owner only, 3 tabs
- **My Account**: email (read-only), phone number, SMS notification toggle (notify on close via Termii)
- **Users**: list staff accounts, create new staff (email+password), activate/deactivate staff
- **Activity Log**: filterable audit trail showing create/update/archive/close/deactivate/activate actions with timestamps

### 7. Sidebar (global, `/app/*`)
- Fixed to viewport — does not scroll with page content
- Navigation items: **Today's Ledger**, **Products**, **History**, **Settings** (Settings/Hidden if staff)
- Low stock badge (amber) on nav when products below threshold
- Pending sync indicator (amber dot with count) when offline mutations pending
- Active page highlighted with primary color
- **Brandmark + Ifesquare logo** at top
- **User email** displayed at bottom (links to Settings)
- **Theme toggle** (dark/light) in sidebar
- **Sign out** button — clears JWT cookie and redirects to login
- **Mobile responsive** — hidden by default, slides in as drawer with backdrop
  - Escape key closes drawer
  - Body scroll locked while open
  - Auto-closes on route change

---

## API Endpoints

| Method | Endpoint | Auth | Role | Purpose | Cached |
|---|---|---|---|---|---|
| `GET` | `/api/health` | No | — | Health check → `{"status":"ok"}` | No |
| `POST` | `/api/auth/login` | No | — | Sign in, returns JWT cookie | No |
| `POST` | `/api/auth/logout` | No | — | Clear JWT cookie | No |
| `GET` | `/api/auth/me` | Yes | Any | Get current user info (email, role, phone, notify_on_close) | No |
| `PATCH` | `/api/auth/me` | Yes | Any | Update phone_number, notify_on_close | No |
| `POST` | `/api/auth/change-password` | Yes | Any | Change password (old + new) | No |
| `GET` | `/api/products` | Yes | Any | List active products | **<1ms** (memory, 60s TTL) |
| `POST` | `/api/products` | Yes | Owner | Create product(s) single or bulk `{products:[...]}` | Invalidates cache |
| `PATCH` | `/api/products/{id}` | Yes | Owner | Update name/price/stock/low_stock_threshold | Invalidates cache |
| `DELETE` | `/api/products/{id}` | Yes | Owner | Archive product | Invalidates cache |
| `GET` | `/api/products/template` | Yes | Owner | Download CSV template (name,price,stock) | No |
| `POST` | `/api/products/import` | Yes | Owner | Bulk import products from CSV body | Invalidates cache |
| `GET` | `/api/ledger/today` | Yes | Any | Get today's entries with product names; auto-creates rows; auto-syncs from last closed; staff gets redacted (no price) | **<1ms** (memory, 60s TTL) |
| `PATCH` | `/api/ledger/today/{productId}` | Yes | Any | Update opening/receipts/closing/price (staff: 403 on price/opening) | Invalidates ledger + history |
| `POST` | `/api/ledger/close` | Yes | Owner | Close today (fill null closings, update stock, SMS if configured) | Invalidates ledger + history list |
| `POST` | `/api/ledger/sync-from-last-closed` | Yes | Owner | (guarded) — rejected if today has data | Invalidates ledger |
| `PATCH` | `/api/ledger/{date}/{productId}` | Yes | Owner | Edit opening/receipts/closing/price on any day | Invalidates ledger + history detail |
| `GET` | `/api/history` | Yes | Owner | List closed days with summary (default limit 30) | **<1ms** (memory, 60s TTL) |
| `GET` | `/api/history/{date}` | Yes | Owner | Get full day detail with computed sales/amount | **<1ms** (memory, 60s TTL) |
| `GET` | `/api/history/{date}/export` | Yes | Owner | Download day entries as CSV (per-day) | No |
| `GET` | `/api/analytics/monthly-comparison` | Yes | Owner | Compare current vs previous month revenue & units | **<1ms** (memory, 60s TTL) |
| `GET` | `/api/users` | Yes | Owner | List staff accounts under this owner | No |
| `POST` | `/api/users` | Yes | Owner | Create staff account (email+password, role='staff') | No |
| `PATCH` | `/api/users/{id}` | Yes | Owner | Activate/deactivate staff account | No |
| `GET` | `/api/audit-log` | Yes | Owner | Filtered activity log (limit, entityType, userId) | No |

### CLI Flags (server binary)
- `--create-user EMAIL` — prompts for password on stdin, creates a user
- `--reset-password EMAIL` — prompts for new password on stdin
- `--logout-all` — invalidates all sessions

---

## Database Schema (8 migrations)

| Table | Purpose |
|---|---|
| `users` | id, email, password_hash, role (owner/staff), owner_id, active, phone_number, notify_on_close, created_at |
| `products` | id, name, price, stock, low_stock_threshold, archived_at, created_at, user_id |
| `days` | user_id, date, closed_at — composite PK on (user_id, date) |
| `entries` | id, user_id, day_date, product_id, opening, receipts, closing (nullable), price, created_at, updated_at — UNIQUE on (user_id, day_date, product_id) |
| `app_meta` | key-value store for global session revocation timestamp |
| `audit_log` | id, scope_id, user_id, action, entity_type, entity_id, before (JSON), after (JSON), created_at |

---

## Key Business Rules

- **Closing a day** auto-fills null closings to `opening + receipts`, then updates product stock to those closings. Sends SMS notification if owner has `notify_on_close` enabled (via Termii API).
- **Auto-sync from last closed** happens on the first page load of a new business day (which rolls over at 2 AM). The most recent previous closed day's closings (skips gaps) become today's opening values and update product stock.
- **Products page merges** product data with today's ledger entries so you edit everything in one place.
- **History editing** for past days allows fixing mistakes; today's closed day is read-only in history (edit via Products page instead).
- **Computed fields** (Total = Opening + Receipts, Sales = Total − Closing, Amount = Sales × Price) are never stored — calculated on read.
- **All numeric inputs** accept commas (parsed client-side); all numeric displays show commas (e.g., ₦1,500).
- **Closing=0 treated as not entered** — Sales and Amount only calculate when `closing > 0`. A closing of `0` displays as `—` (same as `null`).
- **Unit field** — optional, removed in migration 006. Only product name is required.
- **Role-based access control**: Owners see everything. Staff see only the current day's ledger (prices hidden, can only edit receipts/closing, no charts/close/history/settings).
- **Sync conflict guard** — manual sync is rejected if today's entries have non-zero receipts or non-null closing values. Auto-sync on first page load is unaffected.
- **Input validation** — All PATCH/POST endpoints validate: price/stock/opening/receipts/closing ≥ 0, closing ≤ opening + receipts, name non-empty. Violations return 400 with descriptive JSON.
- **Auth guard** — API calls from ProductsProvider and useLedger skip when not authenticated, preventing unnecessary 401/500 errors during rendering edge cases.
- **500 error handling** — Server errors show a user-friendly message instead of raw error text.

---

## Performance Optimizations

### In-Memory Response Cache
- **`GET /api/products`**, **`GET /api/ledger/today`**, **`GET /api/history`**, **`GET /api/history/{date}`**, **`GET /api/analytics/monthly-comparison`** cached in memory (pre-serialized JSON, 60s TTL)
- **Sub-millisecond reads** on cache hit — no network round-trip to Turso
- **Startup pre-load**: goroutine fetches products & today's ledger immediately after DB init
- **Write invalidation**: all POST/PATCH/DELETE handlers invalidate the relevant cache key

### Auth Revocation Cache
- `sessions_revoked_before` value cached in memory with 30s refresh interval
- Eliminates one DB round-trip per authenticated API call (~50-150ms saved per request)

### Batched DB Queries
- `GetTodayEntries()` uses a single transaction: `INSERT OR IGNORE INTO days` + bulk `INSERT OR IGNORE INTO entries ... SELECT ...` combined in one `BEGIN/COMMIT`
- Reduces Turso round-trips from ~5 to **2** (transaction + main query)

### Connection Pool
- Turso: `MaxOpenConns=10`, `MaxIdleConns=10` (vs SQLite local: 1 each)
- Prevents request queuing when multiple API calls arrive in parallel

### Turso Keepalive
- Background goroutine pings `SELECT 1` every 30s to prevent cold starts on the serverless Turso database

### Target Response Times
| Endpoint | Before | After (cached) |
|---|---|---|
| `GET /api/products` | ~50-150ms (Turso net) | **<1ms** (memory) |
| `GET /api/ledger/today` | ~250-750ms (5 round-trips) | **<1ms** (memory) |
| `GET /api/history` | ~50-150ms (Turso net) | **<1ms** (memory) |
| `GET /api/history/{date}` | ~50-150ms (Turso net) | **<1ms** (memory) |
| `GET /api/analytics/monthly-comparison` | ~50-150ms (Turso net) | **<1ms** (memory) |
| Auth'd requests (middleware) | +1 DB round-trip | **<1ms** (cache) |

---

## UI Components

### Layout
- **AppLayout** — authenticated shell with sidebar + scrollable main content
- **Sidebar** — fixed sidebar: brandmark, nav items, low stock badge, pending sync indicator, theme toggle, user email, sign out; mobile drawer with backdrop/escape/body-scroll-lock
- **AppShell / useAppShell** — mobile nav open context

### Auth & Theme
- **AuthProvider** — singleton auth context, calls `GET /api/auth/me` on mount, provides `login/logout/refresh`
- **ThemeProvider** — singleton theme context with localStorage persistence and system preference detection
- **ThemeToggle** — icon-only Sun/Moon button

### Dashboard Components
- **Brandmark** — shared SVG logo component (Login, Coming Soon, Sidebar)
- **DashboardHeader** — date display, refresh button, "Close & save day" button with confirmation dialog
- **MetricCard** — labeled value card with icon, optional sparkline, optional trend line, optional click handler, Framer Motion animated values
- **InsightsCard** — tabbed chart panel with Bar, Pie, Line charts (Recharts) + summary stats
- **MonthComparisonCard** — month-over-month revenue/units comparison with delta %
- **Sparkline** — inline SVG sparkline
- **AnimatedNumber** — Framer Motion spring-animated number display
- **ProductsTable** — view-only dashboard product table (top 8 by revenue, searchable)

### Catalog Components
- **ProductsCatalog** — full mutable product table with sortable columns, inline editing, low stock filter, CSV import/export
- **ProductsProvider** — context provider merging products + ledger entries, debounced save (500ms), offline queue
- **AddProductDialog** — multi-row product creation dialog (up to 16 products)
- **NumericInput** — controlled number input with comma formatting and keyboard input handling
- **CatalogNumericTd**, **CatalogEditableTextTd**, **CatalogTd**, **CatalogTh** — table cell sub-components
- **ProductsTableTh**, **ProductsTableTd** — dashboard table cell sub-components

### History Components
- **DayDetailPanel** — shared day detail for History (side panel on desktop, dialog on mobile), CSV export, inline editing for past days
- **HistoryEditableTd** — inline-editable table cell for history entries

### Shared
- **ErrorBoundary** — React class component error boundary with branded fallback UI + Reload button + Sentry forwarding
- **ToastProvider / useToast** — global toast notification system (top-right, animated, error/success/info types, 5s auto-dismiss)
- **format.ts** — formatting utilities: `fmtInt`, `nairaFmt`, `formatDate`, `parseCommaInt`, `stripNonDigits`, `formatWithCommas`, chart color helpers

### Hooks
- **useAuth** — auth context consumer
- **useTheme** — theme context consumer
- **useLedger** — fetch/manage today's ledger entries + close day
- **useHistory** — fetch closed days list + individual day detail
- **useProducts** — products catalog context consumer
- **usePendingSync** — check pending offline mutation count
- **useToast** — toast notification context consumer

### Libraries
- **lib/api.ts** — fetch wrapper with `ApiError`, credentials: 'include', offline mutation queue fallback
- **lib/types.ts** — shared interfaces (User, ApiProduct, ApiLedgerEntry, ApiHistoryDaySummary, ApiHistoryDayDetail, LedgerRow, MonthlyComparison) + `deriveLedgerRow()` helper
- **lib/utils.ts** — `cn()` utility (clsx + tailwind-merge)
- **lib/offlineQueue.ts** — IndexedDB-backed offline mutation queue using `idb`, auto-replays on `online` event
- **lib/loginErrors.ts** — login error message formatting and code detection

### shadcn/ui Primitives (24 files)
- button, input, label
- Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle
- Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogOverlay, DialogPortal, DialogTitle, DialogTrigger
- Tabs, TabsContent, TabsList, TabsTrigger

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript 6, Vite 8, Tailwind CSS 4, shadcn/ui, Radix UI, Recharts, Framer Motion, Lucide icons |
| Backend | Go 1.26, chi router (v5), JWT auth (HS256, httpOnly cookies), bcrypt |
| Database | SQLite via modernc.org/sqlite (local) or libsql (Turso remote), auto-migrations |
| Auth | bcrypt passwords, JWT (72h TTL), global session revocation, role-based (owner/staff), login rate limiting (5/15min per email) |
| Caching | In-memory response cache (pre-serialized JSON, 60s TTL, write-invalidation), auth revocation cache (30s TTL) |
| Notifications | SMS via Termii API (on day close) |
| Error Tracking | Sentry (frontend `@sentry/react` + backend `sentry-go`) — env-var driven, opt-in |
| PWA | Service worker via vite-plugin-pwa, Workbox API caching, offline mutation queue (IndexedDB) |
| Testing | Frontend: Vitest 4 + Testing Library + jsdom. Backend: Go `testing` package |
| Styling | CSS variables for dark/light theme, petrol-green brand theme, oklch color space |
| Hosting | Vercel (frontend), Render (Go binary backend), Turso (DB) |

---

## Reliability & Ops

### React Error Boundary
- **ErrorBoundary.tsx** wraps `<App />` at the top level
- Catches runtime errors and displays a branded fallback UI with error message + **Reload page** button
- Supports custom `fallback` prop for page-level overrides
- Silently forwards errors to Sentry via `componentDidCatch`

### Sentry Error Tracking
- **Frontend** (`@sentry/react`): initialized in `main.tsx` when `VITE_SENTRY_DSN` is set. Includes `browserTracingIntegration()`, 0.2 tracesSampleRate.
- **Backend** (`sentry-go`): initialized in `main.go` when `SENTRY_DSN` is set. Flushes on shutdown via `defer sentry.Flush(2s)`.
- Both use the environment name from `APP_ENV` / `import.meta.env.MODE`.
- DSN config is env-var driven — set `VITE_SENTRY_DSN` and `SENTRY_DSN` to activate.

### Automated DB Backups
- **scripts/backup-db.sh** — dumps Turso DB via `turso db shell ifesquare ".dump"`, gzips, keeps last 30
- **`.github/workflows/backup.yml`** — runs daily at 06:00 UTC, installs Turso CLI, authenticates with `TURSO_AUTH_TOKEN` secret, dumps DB, uploads artifact (30-day retention)
- Can also be triggered manually via `workflow_dispatch`

### Offline Resilience
- **IndexedDB mutation queue** (`lib/offlineQueue.ts`): POST/PATCH/DELETE queued when offline, replayed on `online` event
- **Workbox cache** (`vite-plugin-pwa`): `NetworkFirst` strategy for GET requests (products, ledger, history)
- **Service worker auto-update** via `vite-plugin-pwa`
- **Web app manifest** with green theme color
- **Pending sync indicator** in sidebar (amber dot + count)

### CSV Export
- **`GET /api/history/{date}/export`** returns a single closed-day's entries as CSV
- Columns: Product, Opening, Receipts, Total, Closing, Sales, Price, Amount
- Includes a **Total row** at the bottom with summed units and revenue
- **Export** button in History page day-detail panel triggers direct download

### CSV Import (Products)
- **`GET /api/products/template`** — download CSV template with header row (name,price,stock)
- **`POST /api/products/import`** — upload CSV body, bulk creates products
- **Import button** on Products page with file picker

### Rate Limiting (Login)
- In-memory sliding-window rate limiter: **5 failed attempts per email per 15 minutes**
- Returns `429 Too Many Requests` with `Retry-After` header when locked out; counter resets on success
- Login errors are generic (`"invalid credentials"`) — no distinction between wrong email and wrong password to prevent user enumeration

### Password Change / Reset
- **`POST /api/auth/change-password`** (authenticated): accepts `old_password` and `new_password` (min 6 chars)
- **CLI `--reset-password EMAIL`** — prompts on stdin
- **CLI `--create-user EMAIL`** — prompts on stdin

### CSRF
- Cookie `Secure` flag: `true` when `APP_ENV=production` or request is over TLS, `false` otherwise
- `SameSite=Lax` explicitly set on all cookies
- No CSRF token needed — frontend and backend share the same origin, `SameSite=Lax` prevents cross-site form submissions on mutating methods

### Deploy Pipeline
- Frontend (Vercel): auto-deploys from GitHub on push via `vercel.json`
- Backend (Render): auto-deploys from GitHub on push (connected via Render dashboard)

---

## Testing

### Frontend
- **Vitest 4** + **Testing Library** + **jsdom**
- `npm test` / `npm run test:watch` to run
- `ErrorBoundary.test.tsx`: 3 tests (happy path, error fallback, custom fallback)
- `App.test.tsx`: smoke test (renders without crashing)
- Type checking excludes test files from `tsconfig.app.json` via `tsconfig.test.json`

### Backend
- Go `testing` package
- `go test ./...` to run
- `internal/auth/auth_test.go`: password hashing, token issue/parse/validation
- `internal/cache/cache_test.go`: set/get, miss, expiry, invalidation, singleton

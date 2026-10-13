---
name: ifesquare-log-2026-07-17
description: Linear daily engineering log for 2026-07-17 on Ifesquare
---

# 2026-07-17

# Day Work — 2026-07-17

## Performance Optimizations

### History Caching

* `ListHandler` now cached via `r.URL.RequestURI()` key — sub-ms response after first hit (was always uncached, 200-400ms per request)
* `GetByDateHandler` cached via `/api/history/{date}` key — same perf win for day detail views
* Cache invalidation wired up: closing a day clears the list cache; patching an entry clears the detail cache for that date

### Cache TTL

* Increased from 30s → 60s in `cache.go` — fewer cache misses

### Turso Keepalive

* Background goroutine pings Turso with `SELECT 1` every 30s — prevents serverless cold starts that caused 5-14s initial response times

## Fix: Closing=0 Treated as "Not Yet Counted"

* `deriveLedgerRow` now only treats `closing > 0` as a real closing value — `0` and `null` both show as `—` with no sales/amount calculated
* Previously `closing=0` was treated as a valid count, incorrectly calculating sales as `opening + receipts - 0`

## V2 Feature 1 — Low-Stock Alerts

### Data model

* Migration `003_low_stock.sql`: `ALTER TABLE products ADD COLUMN low_stock_threshold INTEGER` (nullable — NULL means use global default)
* Global default from `LOW_STOCK_DEFAULT_THRESHOLD` env var (falls back to 10)

### Backend

* **Products** `GET/POST/PATCH` all support `low_stock_threshold` — nullable int, PATCH treats key-presence-as-null as clearing the override, `>= 0` validation
* `GET /api/ledger/today` each row now computes `effectiveThreshold`, `currentStock`, `isLowStock` — currentStock cascade: closing > 0 → closing, else total > 0 → total, else product.stock
* Cache invalidation extended: product creates/updates also invalidate `/api/ledger/today`

### Frontend — Products page

* New sortable "Alert at" column — inline editable; shows resolved default in muted tone with "(default)" label when no custom threshold; reset (×) clears it back to null
* Amber left-border + tinted row background + "Low stock" pill when `isLowStock`
* "Low stock only" toggle in table header, reads/writes `?filter=low-stock` search param

### Frontend — Dashboard

* Grid changed `sm:grid-cols-3` → `sm:grid-cols-4`
* 4th MetricCard: "Low stock" with `AlertTriangle` icon, count or "All stocked", clicks navigate to Products filtered view
* Today's-products table gets same amber row highlighting via `isLowStock` field (no new data needed)

### Frontend — Add Product dialog

* New "Alert below" field (4-column grid now), placeholder shows global default

### Frontend — Sidebar

* Amber count badge on Products nav item when low stock count > 0

## V2 Feature 2 — Motion Polish (Dashboard + Products)

### 1. MotionConfig wrapper

* `<MotionConfig reducedMotion="user">` in `main.tsx` — all animations automatically respect OS reduced motion setting, no per-component checks

### 2. AnimatedNumber component

* `frontend/src/components/AnimatedNumber.tsx` — spring-based count-up using `framer-motion`'s `useSpring`
* Revenue and Units Sold MetricCards on Dashboard animate from previous value → new value over ~700ms
* Top Product card stays static (text, not numeric)

### 3. Sidebar sliding active-item pill

* `LayoutGroup` + `motion.div layoutId="sidebar-active-pill"` — shared pill slides behind whichever nav item is active
* `transition: spring(380, 32)` for natural motion
* Sidebar stays mounted in `AppLayout` (wraps `<Outlet />`), so `layoutId` animates correctly across route changes

### 4. InsightsCard tab crossfade

* `AnimatePresence mode="wait"` wraps chart content with `key={tab}`
* Crossfade: opacity + 6px vertical drift, 180ms
* Only animates opacity/y — never width/scale (avoids Recharts `ResponsiveContainer` flash)

### 5. Products table sort-arrow rotation

* Single `ArrowUp` icon with `animate={{ rotate }}` for active column (180° for desc)
* `ArrowUpDown` (muted) for inactive columns — no animation on inactive
* Removed `ArrowDown` import, no icon swapping

### 6. Products table row save-flash

* `justSaved` Set tracks rows that just completed a successful PATCH
* `flashRow()` called inside `.then()` branch of patch — not optimistic
* `motion.tr` with `boxShadow` animation: translucent green overlay fades over 600ms
* Layers on top of the existing amber low-stock tint via `inset box-shadow`

## Fix: Migration 003 Not Idempotent

* `003_low_stock.sql` uses `ALTER TABLE ADD COLUMN` which crashes on re-run
* `migrate()` now catches "duplicate column" error for 003 and skips it

## Table Grid Lines

* Vertical column separators: `border-r border-border/60` added to all cell components (`CatalogTd`, `CatalogTh`, `CatalogNumericTd`, `CatalogEditableTextTd`)
* Last column's right border removed via `[&_th:last-child]:border-r-0 [&_td:last-child]:border-r-0` on `<table>`
* Header row border made consistent with data rows (`border-border/60`)
* Editable input fields narrowed from `w-full` to fixed widths (`w-24` numeric, `w-28` text) for shorter dashed underlines

## Commits

| Hash | Message |
| -- | -- |
| `418b22e` | implement caching improvements: keep Turso connection warm, update cache expiration logic in handlers |
| `4b1b96e` | cache history endpoints and add turso keepalive ping |
| `130e842` | Add toast on patch failure in ProductsProvider |
| `5e5ccb0` | V2 F1: migration + low_stock_threshold in products struct/queries/handlers |
| `ddc85a2` | V2 F1: compute effectiveThreshold/currentStock/isLowStock in GET /api/ledger/today |
| `af02226` | V2 F1: frontend types + ProductsProvider merge/patch support for low stock |
| `0842cb8` | V2 F1: Products page — Alert at column, filter toggle, row highlighting |
| `06f3d77` | V2 F1: Dashboard — 4th metric card, grid change, table row highlighting |
| `94b0676` | V2 F1: Add Product dialog — Alert below field |
| `ccf214a` | V2 F1: Sidebar — Display low stock alert for Products in the navigation |
| `5e5deb2` | V2 F2: MotionConfig reducedMotion=user wrapper around app |
| `14b24d5` | V2 F2: AnimatedNumber — spring count-up for revenue and units on Dashboard |
| `15d78e5` | V2 F2: Sidebar — layoutId sliding active-item pill |
| `a0385ca` | V2 F2: Insights — AnimatePresence crossfade between chart tabs |
| `893eeb4` | V2 F2: ProductsCatalog — Add low stock indicator and animate sorting icons |
| `06bd45d` | db: make migration 003 (ALTER TABLE) idempotent — skip if column exists |
| `d821d42` | Products table: remove right border from last column, consistent header border |
| `fda0618` | Products table: column separator lines + narrower editable input fields |

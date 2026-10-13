---
name: ifesquare-log-2026-07-19
description: Linear daily engineering log for 2026-07-19 on Ifesquare
---

# 2026-07-19

# Day Work — 2026-07-19

## V2 Feature 6 — Multi-Role (Owner + Staff)

### Step 0 — Data confirmation

* `turso db shell ifesquare "select count(*) from entries"` → 0 rows. Empty dev DB, no data lost.

### Migration 007 — `role`, `owner_id`, `active` on users

* `backend/internal/db/migrations/007_multi_role.sql`
* `role` defaults to `'owner'`, CHECK constraint for `'owner'|'staff'`
* `owner_id` is NULL for owners, set to owner's `id` for staff
* `active` defaults to `1`

### Migration 008 — `audit_log` table

* `backend/internal/db/migrations/008_audit_log.sql`
* Stores `scope_id`, `user_id`, `action`, `entity_type`, `entity_id`, `before`/`after` JSON snapshots, `created_at`
* Indexed on `scope_id`

### Auth middleware overhaul (`auth/middleware.go`)

* New `User` struct: `ID`, `Email`, `Role`, `OwnerID`, `PhoneNumber`, `NotifyOnClose`, `Active`
* `ScopeIDKey` context key — the resolved owner ID that all store functions use
* `UserKey` context key — the full `User` struct is now available to handlers
* `ResolveScopeID(user)` — returns `*OwnerID` for staff, `ID` for owners
* `Middleware` now queries DB for `role`, `owner_id`, `active`, `phone_number`, `notify_on_close` on every authenticated request; rejects inactive users
* `RequireRole(role)` middleware — returns 403 if `user.Role != role`

### Auth handlers updated (`auth/handlers.go`)

* `userResp` — added `Role` and `OwnerID` fields
* `Login` — queries `role`, `owner_id`, `active`; rejects inactive accounts; returns role/owner_id in response
* `Me` / `UpdateMe` — return `role` and `owner_id` in response

### Scope ID substitution (the core fix)

Handlers in products, ledger, history, analytics now extract `ScopeIDKey` from context and pass it to store functions instead of `UserIDKey`. **Store functions keep their exact same signatures and** `AND user_id = ?` **queries** — only the value flowing in changes.

### Cache key prefix

All four `cacheKey()` helpers (products, ledger, history, analytics) now format with `scopeID` instead of `userID`, so owner and staff sharing the same shop data hit the same cache.

### Owner-only route guards (`main.go`)

* `RequireRole("owner")` applied to: POST/PATCH/DELETE `/api/products`, POST `/api/products/import`, POST `/api/ledger/close`, POST `/api/ledger/sync-from-last-closed`, PATCH `/api/ledger/{date}/{productId}`, all of `/api/history*`, `/api/analytics/monthly-comparison`, all of `/api/users`, `/api/audit-log`

### Field redaction in ledger (staff)

* `GET /api/ledger/today` — staff receives `staffEntryResponse` which omits `price` (absent from JSON, not zeroed). Staff cache is never written (owner cache remains unaffected).
* `PATCH /api/ledger/today/{productId}` — staff requests with `price` or `opening` in body get 403; only `receipts` and `closing` are accepted.

### Audit log wiring

* `audit_log.Write()` called inside products.Create, products.Update, products.Archive, ledger.UpdateEntry (today), ledger.UpdateEntry (history), ledger.CloseDay, users.Create, users.Update
* Records `scope_id` (the shop), `user_id` (the actual login), before/after snapshots

### User management endpoints (`internal/users/handlers.go`)

* `GET /api/users` — lists staff accounts under owner's scope (and the owner themselves)
* `POST /api/users` — creates staff account, hard-codes `role: "staff"` and `owner_id: <caller's scopeID>`
* `PATCH /api/users/{id}` — toggle `active` for staff accounts under this owner
* All endpoints write to audit_log

### Audit log endpoint (`internal/audit_log/handlers.go`)

* `GET /api/audit-log` — supports `?limit=N&entityType=X&userId=Y`, filtered by scope_id

### Frontend — User type

* `User` now includes `role: "owner" | "staff"` and `owner_id: number | null`

### Frontend — Sidebar

* Staff sees only "Today's ledger"
* Owner sees all 4 items: Today's ledger, Products, History, Settings
* Settings dialog removed (moved to `/app/settings` page); email becomes a link to settings for owners

### Frontend — Dashboard

* Staff: Units Sold + Low Stock cards only. Hides Today's Revenue, Top Product, MonthComparisonCard, InsightsCard, Close Day button
* `ProductsTable` accepts `hideFinancials` prop to suppress Price/Amount columns

### Frontend — Route guards

* `StaffRouteGuard` — redirects staff away from `/app/products`, `/app/history`, `/app/settings` to `/app`
* All owner-only routes on backend also return 403 if staff manages to hit the API directly

### Frontend — Settings page (`/app/settings`)

* "My account" tab: phone number + notify toggle (migrated from Sidebar dialog)
* "Users" tab: list staff accounts, create new staff, deactivate/activate
* "Activity log" tab: audit feed with action/entity/time

### New files

| File | Purpose |
| -- | -- |
| `backend/internal/db/migrations/007_multi_role.sql` | ALTER users: add role, owner_id, active |
| `backend/internal/db/migrations/008_audit_log.sql` | CREATE audit_log table + index |
| `backend/internal/audit_log/store.go` | `Write()` helper — inserts audit entries |
| `backend/internal/audit_log/handlers.go` | `GET /api/audit-log` — owner-only, filtered by scope |
| `backend/internal/users/handlers.go` | `GET/POST/PATCH /api/users` — staff mgmt |
| `frontend/src/pages/SettingsPage.tsx` | 3-tab settings: account, users, activity log |

### Modified files

`backend/internal/auth/middleware.go`, `backend/internal/auth/handlers.go`, `backend/internal/products/handlers.go`, `backend/internal/ledger/handlers.go`, `backend/internal/history/handlers.go`, `backend/internal/analytics/handlers.go`, `backend/cmd/server/main.go`, `backend/internal/db/db.go`, `frontend/src/lib/types.ts`, `frontend/src/components/dashboard/Sidebar.tsx`, `frontend/src/components/dashboard/DashboardHeader.tsx`, `frontend/src/components/dashboard/ProductsTable.tsx`, `frontend/src/components/AppRoutes.tsx`, `frontend/src/pages/DashboardPage.tsx`

### Tests

* All existing backend tests pass (auth, cache)
* Backend builds cleanly
* Frontend type-checks cleanly (`tsc --noEmit`)

### Settings page — UI polish

* All three cards now use `hoverable={false}` with `py-0 overflow-hidden` pattern (matching HistoryPage/DayDetailPanel)
* Card headers are plain `border-b border-border px-5 py-4` divs instead of `CardHeader`/`CardContent` components
* No hover effects on cards or activity log rows
* User list uses `divide-y divide-border` container pattern
* Create staff form uses tighter spacing, smaller button

## What's still missing

* Seed script to create owner + staff accounts for local testing
* E2E test verifying staff cannot fetch price/amount via direct API calls
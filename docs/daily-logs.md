# Ifesquare Engineering Daily Logs

Chronological daily work and architecture logs from Linear.


---

## 2026-09-22

# Day Work Report — September 22, 2026

Today, we worked on sales history calculation and labeling improvements, enhanced CSV product import duplicate validation, test account data reset, and resolved production duplicate entries. All changes have been built, verified, and committed to git.

---

## 1. Sales History "Total amount" Calculation & Scope Boundary

* **Files Modified**:
  * `backend/internal/history/store.go`
  * `backend/internal/history/handlers.go`
  * `frontend/src/lib/types.ts`
  * `frontend/src/components/dashboard/DayDetailPanel.tsx`
  * `frontend/src/pages/HistoryPage.tsx`
* **What was done**:
  * **Accurate Day Calculation**: In the closed-day history view (`DayDetailPanel.tsx`), the day's total amount and units sold are now calculated from product 1 to the product end matching the Products table formula: `(detail?.entries ?? []).reduce((s, r) => s + (r.amount ?? 0), 0)`.
  * **Clean Labeling**: Standardized the labeling across the closed days list, day detail panel header (`Total amount: ₦... (X units sold)`), table footer (`Total amount`), and CSV export summary row (`Total Amount`).
  * **Optimistic Updates**: Updated `HistoryPage.tsx` so inline cell edits optimistically recalculate the day totals using the identical reduce pattern.
  * **Scope Boundary Preserved**: Kept `DashboardPage.tsx` and all other pages completely untouched with their original `total_revenue` metric intact.

---

## 2. Enhanced CSV Import Duplicate Validation

* **Files Modified**:
  * `backend/internal/products/handlers.go`
  * `backend/internal/products/import_test.go`
* **What was done**:
  * **Scrutiny Rules**: Enhanced product duplicate validation during CSV upload so that products sharing the same name are scrutinized by `price`, `opening stock`, and `closing stock`.
    * **Different opening or closing stock**: If two products share the same name, but opening or closing stock are different, **both are imported** (even if prices are identical).
    * **Same opening & closing, different price**: If opening and closing stock are the same, but prices are different, **both are imported**.
    * **Exact match**: Only when name, price, opening stock, AND closing stock all match is the row treated as a duplicate and only one imported.
  * **Comprehensive Deduplication**: Applied this logic to both rows within the same CSV upload (`seen`) and against pre-existing database products (`existing`).
  * **Clear Error Messaging**: Formatted duplicate skip notices in clear human English detailing the product name, price, opening stock, and closing stock.
  * **Unit Tests**: Updated `TestImportStoresReceiptsAndClosing` and added `TestImportDuplicateRules` and `TestImportDuplicateAgainstExistingInDatabase` to test all combinations.

---

## 3. Account Data Reset (`olajubajeifeoluwa93@gmail.com`)

* **What was done**:
  * Safely cleared all test data attached to `olajubajeifeoluwa93@gmail.com` (User ID: 1, Owner) inside an atomic database transaction while preserving the user account and login credentials.
  * Purged:
    * 132 products
    * 1,188 daily ledger entries
    * 9 closed history days
    * 463 audit log entries
    * 1 linked staff account
  * Verified account remains active with a completely clean slate for fresh testing.

---

## 4. Production Duplicate Entries Cleanup (`odunayoeuniceolajubaje@gmail.com`)

* **Issue Identified**:
  * On Monday, 21 September 2026, closed day totals showed doubled figures (285 units sold, ₦859,650 instead of 143 units and ₦430,500).
  * Root cause analysis revealed two import batches were run on 21 Sept (143 products each). The first batch (IDs 133–275) was subsequently archived, but its ledger entries for 21 Sept remained in the database, causing the day summary to double-count both batches.
* **Fix Implemented**:
  * Executed an atomic database transaction on Turso:
    * Deleted the 143 duplicate ledger entries for 21 Sept from Batch 1.
    * Deleted the 143 archived product records from Batch 1.
  * Verified 21 Sept now reflects 144 items, 143 units sold, and the exact expected amount of **₦430,500**.
  * Verified active catalog on 22 Sept has 144 active products (0 archived).

---

## 5. Git Commits Log

| Hash | Message |
| -- | -- |
| `2bcae97` | `refactor(history): calculate total_amount and export Total Amount in CSV` |
| `98d7156` | `feat(history): calculate and display Total amount in closed days list and day detail` |
| `08d89e3` | `style(types): format type definitions for consistency` |
| `974e48d` | `feat(products): validate duplicates on CSV import using name, price, opening, and closing stock` |

---

*Report compiled on: 2026-09-22T09:27:00+01:00*

---

## 2026-08-16

## Task Summary: Closing Stock Validation & Error Reversion

We added client-side validation, error handling, and visual/state rollback when editing product ledger fields (opening, receipts, closing, price).

### Key Features Implemented

1. **Validation Checks**:
   * Both the **Products Page** (today's active ledger) and the **History Days** products view now prevent entering a `closing` stock that exceeds the `total` stock (opening + receipts).
   * If a user tries to input an invalid closing stock, a toast notification immediately warns them: *"closing cannot exceed total (opening + receipts)"*.
2. **UI & Calculations Rollback**:
   * If the client-side check or server-side API patch fails, the application automatically catches the error and rolls back the optimistic UI state.
   * The cell text fields revert visually to their last valid values on focus out (blur), and the calculated total units and revenue are recalculated and restored.

### File Modifications

* **HistoryEditableTd.tsx**: Updated to await `onChange` and revert the local display state to the expected value if the change resolves to `false` (rejection).
* **DayDetailPanel.tsx**: Propagated the promise returned by `patchEntry` to the cell editors.
* **HistoryPage.tsx**: Added client-side check, try/catch around the API call, and full rollback of the `detail` state and left panel `days` list totals on error.
* **CatalogNumericTd.tsx**: Added `onBlur` handler to restore display to the correct prop-derived value on blur.
* **ProductsProvider.tsx**: Added client-side validation check in `patchCatalogField` to immediately abort before optimistic state updates, and added `refresh()` rollback on API failure.

### Commits Created

* **Commit 1 (a98e0f6)**: `fe(products): add client-side closing stock validation and rollback on error`
* **Commit 2 (d8159bd)**: `fe(history): add client-side closing stock validation and rollback on error`

---

## 2026-08-11

# Day Work Report — August 11, 2026

Today, we resolved several responsiveness, overflow, and emailing workflow bugs across the application. All changes have been built, verified, and committed to git.

---

## 1. Responsiveness & Overflow-X Fixes

### A. Core Layout & Tab Navigation Scrolling

* **Files Modified**:
  * [`frontend/src/index.css`](file:///home/emanncode/Documents/code/ifesquare/frontend/src/index.css)
  * [`frontend/src/components/ui/TabsList.tsx`](file:///home/emanncode/Documents/code/ifesquare/frontend/src/components/ui/TabsList.tsx)
* **What was done**:
  * Added the `@utility scrollbar-none` class to `index.css` to hide horizontal browser scrollbars while keeping overflow scrolling active.
  * Modified the core `tabsListVariants` in `TabsList.tsx` to prevent horizontal lists (like the Dashboard Insights chart tabs and the main Settings tabs) from exceeding the page width. They now scroll horizontally on smaller mobile viewports (`max-w-full overflow-x-auto justify-start scrollbar-none`).

### B. LoginPage Width Correction

* **Files Modified**:
  * [`frontend/src/pages/LoginPage.tsx`](file:///home/emanncode/Documents/code/ifesquare/frontend/src/pages/LoginPage.tsx)
* **What was done**:
  * Replaced the non-standard `max-w-95` container class with the standard responsive width `max-w-sm` (384px) to ensure the login card fits perfectly on narrow screen viewports without stretching or overflowing.

### C. Products Page Header & Mobile Summary Drawer

* **Files Modified**:
  * [`frontend/src/pages/ProductsPage.tsx`](file:///home/emanncode/Documents/code/ifesquare/frontend/src/pages/ProductsPage.tsx)
* **What was done**:
  * Restructured the page header flex layout from `mb-6 flex items-center gap-3` to a responsive column-to-row layout (`flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between`).
  * Grouped the hamburger toggle menu and the "Products" title so they align nicely, and configured the action buttons to wrap on smaller screens (`flex flex-wrap items-center gap-2`).
  * Styled the *Send Summary* dropdown as a modern, native-feeling bottom sheet drawer anchored at `bottom-4` on mobile viewports, complete with a backdrop blur overlay (`bg-black/40 backdrop-blur-[1px]`) that closes on click. On desktop screens, it automatically reverts to its absolute placement.

### D. Landing Mockup Cards & Stats Grid

* **Files Modified**:
  * [`frontend/src/components/landing/HeroSection.tsx`](file:///home/emanncode/Documents/code/ifesquare/frontend/src/components/landing/HeroSection.tsx)
  * [`frontend/src/components/landing/StatsSection.tsx`](file:///home/emanncode/Documents/code/ifesquare/frontend/src/components/landing/StatsSection.tsx)
* **What was done**:
  * Changed the hero section container padding on the landing page from `px-[10%]` to responsive `px-4 sm:px-[10%]` to free up horizontal space.
  * Swapped the rigid 3-column grids on mobile with responsive configurations (`grid-cols-1 sm:grid-cols-3` for hero mockup cards, and `grid-cols-1 md:grid-cols-3` for stats blocks) so they stack cleanly on mobile phones.

---

## 2. Emailing & Recipient Settings Fix

* **Files Modified**:
  * [`frontend/src/pages/ProductsPage.tsx`](file:///home/emanncode/Documents/code/ifesquare/frontend/src/pages/ProductsPage.tsx)
* **Issue identified**:
  * The backend emailing endpoint loops and sends to all recipient addresses passed in the request body from the frontend. However, the manual Send Summary dropdown checked state list was initialized only with `"self"` (`useState(["self"])`).
  * Because any additional emails (`email2` and `email3` linked in Settings) were unchecked by default, sending a summary without manually opening the dropdown and checking the boxes sent only to the primary email `olajubajeifeoluwa93@gmail.com`.
* **Fix implemented**:
  * Initialized the selection list state with all possible recipient IDs (`["self", "email2", "email3"]`). Any linked emails are now checked and active by default when triggering reports.

---

## 4. Multi-Tab Synchronization & Caching (Distributed System Architecture)

* **Files Modified**:
  * [`frontend/src/lib/offlineQueue.ts`](file:///home/emanncode/Documents/code/ifesquare/frontend/src/lib/offlineQueue.ts)
  * [`frontend/src/components/AuthProvider.tsx`](file:///home/emanncode/Documents/code/ifesquare/frontend/src/components/AuthProvider.tsx)
  * [`frontend/src/setupTests.ts`](file:///home/emanncode/Documents/code/ifesquare/frontend/src/setupTests.ts)
* **Issues identified**:
  * **Concurrently Replayed Queues**: When going back online, multiple tabs would capture the browser's `"online"` event simultaneously and concurrently execute `replayQueue()`, leading to duplicate POST requests (e.g. duplicate sales) on the backend database.
  * **State Isolation**: UI indicators (like pending sync counts) and data hooks (`useLedger`) did not synchronize state or refetch data across tabs when mutations were queued/processed.
  * **Silent Cross-Tab Logouts**: Logging out in one tab did not reactively log out or sync authentication states across other open tabs.
  * **bfcache Restoration**: Waking the page from the browser's back/forward cache (bfcache) restored the previous React DOM snapshot without re-validating the authentication session or loading fresh data.
  * **Test runner error**: Vitest jsdom environments crashed on import of `offlineQueue.ts` due to missing `indexedDB` globals.
* **Fixes implemented**:
  * **Web Locks API Integration**: Wrapped `replayQueue()` with `navigator.locks.request` using the lock name `"ifesquare-offline-replay-lock"` and `{ ifAvailable: true }` to ensure only one tab executes the replay queue while other tabs skip.
  * **BroadcastChannel Integration**: Set up a `"ifesquare-sync"` `BroadcastChannel` in `offlineQueue.ts` to coordinate queue counts, app-data-sync, and app-sync-skipped updates across open tabs.
  * **Storage Event Listener**: Added a `window` listener for `"storage"` changes in `AuthProvider.tsx` to reactively log out or refresh same-origin tabs when the session key changes.
  * **PageShow Event listener**: Registered a `"pageshow"` event listener in `AuthProvider.tsx` that checks `event.persisted` to recheck auth validity and pull fresh data when the tab is restored from the back/forward history cache.
  * **Vitest IDB Mock**: Mocked the `"idb"` package in `setupTests.ts` to prevent test-runner crashes under jsdom environment.

---

## 5. Git Commits Log

We grouped and committed the changes under the following commit hashes:

1. `c061cac` — *style: add scrollbar-none utility and support scrollable horizontal tabs on mobile*
2. `33d8ef6` — *fix(login): replace non-standard max-w-95 with standard max-w-sm*
3. `adf984e` — *feat(products): improve header layout responsiveness and convert send summary dropdown to bottom drawer on mobile*
4. `6b2c661` — *style(landing): make hero mockup cards and stats grid responsive on mobile*
5. `ac6cf30` — *fix(products): select all configured recipient emails by default for manual summaries*
6. *Pending commit* — *feat(sync): implement Web Locks queue replayer, BroadcastChannel tab sync, storage logout listeners, and bfcache wakeups*

---

*Report compiled on: 2026-08-11T14:14:00+01:00*

---

## 2026-08-10

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

---

## 2026-07-29

# Day Work — 2026-07-29

## Database Cleanup — Delete User [odunayoeuniceolajubaje@gmail.com](<mailto:odunayoeuniceolajubaje@gmail.com>) (Round 1)

### Discovery

* Database is **Turso (remote)**, **not** local SQLite — uses `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` from `backend/.env`.
* Local `ifesquare.db` was a red herring; the real data is on AWS via Turso.
* No `--delete-user` flag exists in the server binary — deletion done via custom Go scripts connecting to Turso directly.

### Deletion (Round 1)

* User `odunayoeuniceolajubaje@gmail.com` had user ID 8.
* Cleaned tables in FK order: `audit_log`, `entries`, `days`, `products`, unlinked `users.owner_id` references, then deleted the user row.
* **Done.**

---

## Restore HistoryPage.tsx

* File `frontend/src/pages/HistoryPage.tsx` was deleted in commit `980b950`.
* Vite build error: `[plugin:vite:import-analysis] Failed to resolve import "@/pages/HistoryPage"`.
* Restored the file from git history.
* Build passes cleanly (`npm run build`).
* Pushed fix commit `190082f` to `origin/main`.

---

## CSV Import Analysis

### Template investigation

* Template handler `TemplateHandler` outputs: `Product, Opening, Receipts, Closing, Price, Alert at` (comma-separated, not tab-separated as visually rendered in chat).
* Import handler `ImportHandler` validates these exact 6 headers and auto-detects tab vs comma delimiters.
* `parsePrice` handles decimals (`2166.7` → `2167`) and fractions (`3833 1/3` → `3833`).

### Import results

* **First import** (user 10): 25 created, 110 skipped — rows 2-4 reported "invalid Price" despite having valid values (`21000`, `5450`, `19200`). Root cause unclear — possibly file was different at upload time.
* **Second import**: 107 created, 28 skipped. Skips were products already in user 10's account from the first import. All 132 products now present.

### Verified

* Data isolation is correct — all queries use `WHERE user_id = ?`, scoped to the logged-in user. User 7's 132 products have no effect on user 10's import.
* Current CSV on USB parses perfectly — all 135 prices valid.

### Error message rewrite

Rewrote import error messages for clarity in `backend/internal/products/handlers.go`:

| Before | After |
| -- | -- |
| `already exists on server` | `already in your product list` |
| `too few columns` | `skipped – not enough columns (expected 6)` |
| `Product is required` | `skipped – product name is empty` |
| `already exists (see row N)` | `appears more than once in your CSV (first at row N)` |
| `invalid Opening` / `invalid Receipts` / `invalid Closing` | `skipped – X must be a positive whole number` |
| `invalid Price` | `skipped – Price must be a valid number` |
| `invalid Alert at` | `skipped – Alert at must be a positive whole number` |

Server rebuilt and restarted.

---

## Database Cleanup — Delete User [odunayoeuniceolajubaje@gmail.com](<mailto:odunayoeuniceolajubaje@gmail.com>) (Round 2)

* User had returned as user ID 10 with 132 products, 132 entries.
* Deleted: 132 products, 132 entries, 1 day, 1 user.
* No orphaned data remaining.

---

## Current Status

* User `odunayoeuniceolajubaje@gmail.com` and all data deleted from Turso.
* CSV import error messages rewritten and deployed.
* Users remaining: id=7 `olajubajeifeoluwa93@gmail.com`, id=9 `emanncode@gmail.com`.

## Next Steps

1. Run `cd backend && go run ./cmd/server/main.go --create-user=<email>` to create a new account, typing the password on stdin.

---

## 2026-07-27

# Day Work — 2026-07-27

## Summary

Full verification, bug-fixing, and performance optimization session. Started with a feature verification report, worked through 10+ fix items, then implemented route-level code splitting and data prefetching for instant page loads. Diagnosed and fixed SSE JSON parsing bug and auto-refresh-after-import issue across 3 rounds.

---

## 1. Feature Verification Report

Generated and saved to `FEATURE_VERIFICATION_REPORT.md`. Verified 41 features across frontend V1/V2, backend V1/V2, performance, and reliability. Found 4 partially implemented features, 1 missing feature, and several minor discrepancies.

---

## 2. Bug Fixes

### 2.1 closing=0 Bug (Critical)

**Files:**

* `backend/internal/history/handlers.go:77,145` — `GetByDateHandler` and `ExportCSVHandler`
* `backend/internal/history/store.go:25,32` — `ListClosedDays` SQL queries

**Problem:** `closing=0` was treated as a valid closing count, computing `sales = total - 0 = total`. Should be treated as "not yet counted" (same as NULL).

**Fix:** Changed `e.Closing != nil` → `e.Closing != nil && *e.Closing > 0` in handlers. Changed `WHEN e.closing IS NOT NULL` → `WHEN e.closing IS NOT NULL AND e.closing > 0` in store SQL.

**Confirmed correct:** `ledger/store.go:212,252,270` instances of `closing IS NOT NULL` are intentionally correct (they check "was it counted?" not "is there a meaningful sales amount?").

---

### 2.2 Login Error Enumeration Leak (Security)

**File:** `frontend/src/lib/loginErrors.ts`

**Problem:** Frontend had dead code mapping `wrong_email` → "No account found" and `wrong_password` → "Incorrect password", leaking whether an email exists. Backend only sends generic "invalid credentials" (`backend/internal/auth/handlers.go:31`).

**Fix:** Rewrote `loginErrors.ts` — removed `WrongEmail`/`WrongPassword` constants, removed `isWrongEmailError`/`isWrongPasswordError` functions, removed the switch cases. All 401 errors now return "Email or password is incorrect."

---

### 2.3 Settings Tabs for Staff Users

**File:** `frontend/src/pages/SettingsPage.tsx`

**Problem:** Users tab (`GET /api/users`) and Activity log tab (`GET /api/audit-log`) are protected by `auth.RequireRole("owner")` middleware. Staff users saw 403 errors with generic "Failed to load" messages.

**Fix:** Wrapped both the `TabsTrigger` elements and `TabsContent` elements in `{user.role === "owner" && (...)}` so staff users only see the "My account" tab.

---

### 2.4 500 Error Message

**File:** `frontend/src/components/dashboard/ProductsProvider.tsx:19`

**Problem:** Error message said "Please check the server logs and try again" — developer-oriented, not user-friendly.

**Fix:** Changed to "Please try again later."

---

## 3. Performance Improvements

### 3.1 Batched SQL Transactions

**File:** `backend/internal/ledger/store.go`

`ensureEntries` **(lines 117-141):** Was doing individual `db.DB.Exec()` calls in a loop without a transaction. Now wraps all inserts in `db.DB.Begin()` / `tx.Commit()`.

`SyncFromLastClosedDay` **(lines 234-296):** Was doing individual `db.DB.Exec()` UPDATE calls in a loop without a transaction. Now collects rows first, then executes all updates in a single transaction.

**Confirmed correct as-is:** `ImportHandler` in `backend/internal/products/handlers.go` already uses `tx` for its row-by-row INSERTs.

---

### 3.2 Route-Level Code Splitting

**File:** `frontend/src/components/AppRoutes.tsx`

**Before:** All 6 page components statically imported → single JS bundle.

**After:** `React.lazy()` + `<Suspense>` for ComingSoonPage, LoginPage, DashboardPage, HistoryPage, ProductsPage, SettingsPage. Each page loads its own chunk on demand. Added `PageLoader` component for fallback UI.

---

### 3.3 Data Prefetching on Hover

**New file:** `frontend/src/hooks/usePrefetch.ts`

Created `usePrefetch` hook with:

* `prefetchDashboard()` — fetches `/api/ledger/today` + `/api/analytics/monthly-comparison`
* `prefetchProducts()` — fetches `/api/products`
* `prefetchHistory()` — fetches `/api/history?limit=30`
* `prefetchAll()` — calls all three
* `scheduleIdle()` — uses `requestIdleCallback` (with setTimeout fallback)
* Deduplication via `Set<string>` — each endpoint prefetched at most once

**File:** `frontend/src/components/dashboard/Sidebar.tsx`

Added `onMouseEnter={() => prefetchMap[item.to]?.()}` to each `NavLink` in the sidebar. Hovering over a nav link triggers background data fetch for that page.

---

### 3.4 Idle Prefetch After Login

**File:** `frontend/src/components/layout/AppLayout.tsx`

Added `useEffect` that calls `scheduleIdle(prefetchAll)` on mount. After login, all page data (dashboard, products, history) is prefetched during browser idle time.

---

### 3.5 Expanded Service Worker Caching

**File:** `frontend/vite.config.ts`

**Before:** Cached `GET /api/(products|ledger/today|history)`.

**After:** Also caches `GET /api/analytics/monthly-comparison`, `GET /api/users`, `GET /api/audit-log`. All use NetworkFirst with 3-second timeout.

---

## 4. UX Improvements

### 4.1 Auto-Refresh After CSV Import (3 rounds of fixes)

**File:** `frontend/src/pages/ProductsPage.tsx`

**Round 1 — Initial:** Added `useProducts()` hook import and `const { refresh } = useProducts()`. After import completes successfully, calls `await refresh()`.

**Round 2 — SSE JSON fix:** Backend `ImportHandler` SSE `done` event sent `{"type":"done","created":123}}` (double `}}`). Root cause: `respBytes[1:]` stripped the leading `{` but left the trailing `}`, and `fmt.Sprintf` added another `}`. Fixed in `backend/internal/products/handlers.go:431` by changing `respBytes[1:]` to `respBytes[1:len(respBytes)-1]`.

**Round 3 — Buffer processing + refresh guarantee:** Two remaining bugs:

1. When `reader.read()` returned `done: true`, code broke immediately without processing remaining buffer. The `done` SSE event could be sitting in the buffer unprocessed, leaving `finalResult` null.
2. `refresh()` was inside the `if (finalResult)` block — if parsing failed or `done` event was missed, products never refreshed.

**Fix:** Added `processLine()` helper function. On stream close (`done: true`), remaining buffer is now processed before breaking. `refresh()` moved to the `finally` block so it always runs regardless of import success or failure.

---

### 4.2 Syncing Message in Center

**File:** `frontend/src/components/dashboard/ProductsCatalog.tsx`

**Problem:** When no products existed, showed static "No products yet. Add your first product." even during loading/syncing states.

**Fix:** When `rows.length === 0`, now shows:

* "Importing products…" with spinner (during CSV import)
* "Syncing with server…" with spinner (during loading)
* "No products yet. Add your first product." (when truly empty)

---

## 5. Testing

### 5.1 Staff Security Tests

**New file:** `backend/internal/auth/middleware_test.go`

6 tests covering:

* `TestRequireRole_OwnerAllowed` — owner passes RequireRole("owner")
* `TestRequireRole_StaffRejected` — staff gets 403 from RequireRole("owner")
* `TestRequireRole_NoUserRejected` — missing user gets 403
* `TestResolveScopeID_OwnerReturnsOwnID` — owner scope = own ID
* `TestResolveScopeID_StaffReturnsOwnerID` — staff scope = owner's ID
* `TestResolveScopeID_StaffNoOwnerReturnsOwnID` — staff without owner falls back to own ID

All tests pass.

### 5.2 Seed Script

**New file:** `scripts/seed-test-users.sh`

Creates owner + staff test accounts. Configurable via env vars:

* `OWNER_EMAIL` (default: `owner@test.com`)
* `OWNER_PASSWORD` (default: `password123`)
* `STAFF_EMAIL` (default: `staff@test.com`)
* `STAFF_PASSWORD` (default: `password123`)
* `DB_PATH` (default: `./ifesquare.db`)

---

## 6. Database Operations

Cleared `olajubajeifeoluwa93@gmail.com` data from Turso **three times** during testing:

* First: Deleted 132 products, 132 entries, 6 days
* Second: Deleted 132 products, 132 entries, 1 day
* Third: Deleted 132 products, 132 entries, 1 day (for auto-refresh retest)

Used Go script (`/tmp/clear_user.go`) connecting to Turso via `libsql-client-go`.

---

## 7. Commits Created

| Hash | Message |
| -- | -- |
| `6023e43` | fix: treat closing=0 as not counted in history handlers and store |
| `e0c0641` | fix: remove login error enumeration leak |
| `363ccc3` | fix: hide Users and Activity tabs for staff users |
| `e094966` | perf: wrap ensureEntries and SyncFromLastClosedDay in transactions |
| `90d801a` | fix: auto-refresh products after CSV import and show sync state |
| `8423be0` | fix: make 500 error message user-friendly |
| `a3dc8dd` | test: add seed script and staff security tests |
| `*` | perf: React.lazy code splitting + prefetch hook + sidebar hover prefetch + idle prefetch + expanded SW cache |
| `9678484` | fix(products): ensure buffer processed on stream close and refresh always runs |
| `13395a0` | perf(products): batch CSV import with multi-row INSERT in chunks of 100 |
| `6ee55aa` | ops: add automated daily Turso backup via GitHub Actions |
| `4747c80` | feat(dashboard): wire revenue sparkline to real history data |
| `f304852` | feat(landing): add product-preview mockup to hero section |
| `a5d1e0f` | fix(dashboard): include low-stock items beyond top-8 in today's table |
| `ed2ac18` | feat(products): add archive restore with archived products filter |
| `b572a80` | docs: update daily work log with all completed items |
| `978c936` | fix(cache): store full todayResponse in cache instead of raw entries |
| `755fab1` | fix(products): type ledger/today response as TodayResponse instead of flat array |
| `979dcb0` | fix(history): make day detail panel scrollable inside mobile dialog |
| `fe0c35c` | fix: audit-driven fixes — cache invalidation, closing=0 consistency, SSE headers |
| `9aa38e3` | fix: network error messages + independent day detail scroll |
| `4a6c258` | fix: defensive handling for stale SW cache + bust api-cache-v2 |
| `083cac9` | fix: TS build errors blocking deploy (usePrefetch, ProductsPage) |
| `08903d5` | fix: cast window.setTimeout to any for Vercel TS strict mode |

---

## 9. Bug Fixes After Initial Implementation

### 9.1 Cache storing raw entries instead of todayResponse

**File:** `backend/internal/ledger/handlers.go:128`

`cache.Set(ck, entries)` stored the raw entries array. On cache hit the frontend received `[...]` instead of `{entries, closed_at}`, causing `data.entries` to resolve to `Array.prototype.entries` (a function) and crash during `.map()`.

**Fix:** Cache the full `todayResponse` struct.

### 9.2 ProductsProvider typing ledger/today as flat array

**File:** `frontend/src/components/dashboard/ProductsProvider.tsx:71-73`

`api<ApiLedgerEntry[]>("/api/ledger/today")` typed the response as a flat array, but the backend returns `{entries, closed_at}`. On cache miss the response was the object, causing `entries is not iterable` when `merge()` tried to iterate over it.

**Fix:** Type as `TodayResponse`, access `.entries`.

### 9.3 Mobile history dialog not scrolling

**File:** `frontend/src/components/dashboard/DayDetailPanel.tsx`

When rendered inside a mobile dialog, the Card content was not scrollable because it lacked flex sizing and overflow rules.

**Fix:** In dialog mode, Card gets `flex-1 min-h-0 flex flex-col` and content div gets `overflow-y-auto min-h-0`.

### 9.4 History cache never invalidated

**File:** `backend/internal/history/handlers.go:23`

Cache key included query params (`r.URL.RequestURI()` → `/api/history?limit=30`) but invalidation used bare path (`/api/history`). Keys never matched.

**Fix:** Use fixed key `/api/history` without query params.

### 9.5 closing=0 corrupting product stock in CloseDay

**File:** `backend/internal/ledger/store.go:331-357`

`CloseDay` only auto-closed `WHERE closing IS NULL` (correct), but then read ALL entries and set product stock to closing — including closing=0 entries, setting stock to 0.

**Fix:** Filter stock update to `WHERE closing IS NOT NULL AND closing > 0`. Same fix applied to `autoSyncFromLastClosed` and `SyncFromLastClosedDay`.

### 9.6 SyncFromLastClosedHandler not invalidating analytics/history cache

**File:** `backend/internal/ledger/handlers.go:427-428`

Only invalidated `/api/ledger/today`. After sync, history and analytics caches were stale.

**Fix:** Also invalidate `/api/history` and `analytics:monthly-comparison:{today}`.

### 9.7 Network errors showing raw error messages

**File:** `frontend/src/lib/api.ts` + 10 other files

When the backend is down, `fetch` throws a `TypeError` ("Failed to fetch"). All error handlers showed this raw message, which confused users. Some places showed "unauthorized" when it was actually a network issue.

**Fix:** Added `errorMessage()` helper that detects `TypeError` (network errors) and returns "Unable to connect to the server. Please check your connection and try again." Updated all 15+ error handlers across the codebase.

### 9.8 DayDetailPanel pushing page height on desktop

**File:** `frontend/src/components/dashboard/DayDetailPanel.tsx` + `frontend/src/pages/HistoryPage.tsx`

On desktop, the detail panel grew with its table content, making the whole page scroll. The user wanted the detail panel to scroll independently while the page only scrolls for the days list.

**Fix:** DayDetailPanel uses `sticky top-6 max-h-[calc(100svh-6rem)]` with `overflow-y-auto` for independent scroll. HistoryPage grid uses `items-stretch` on lg so the detail column fills viewport height.

### 9.9 Stale SW cache causing `.map is not a function` crash on live

**File:** `frontend/src/components/dashboard/ProductsProvider.tsx` + `frontend/src/hooks/useLedger.ts` + `frontend/vite.config.ts`

The service worker (`NetworkFirst` with 3s timeout) served a stale cached `/api/ledger/today` response in the old format (raw array) instead of `{entries, closed_at}`. When `merge()` received this, `ledger?.entries` resolved to the array's `.entries()` iterator method (a function), not data. Calling `.map` on that crashed the entire dashboard.

**Fix:** Added `todayEntries()` and `safeEntries()`/`safeClosedAt()` helpers that detect both old (raw array) and new (`{entries, closed_at}`) formats. `merge()` now coerces both args to arrays defensively. Bumped SW cache name from `api-cache` to `api-cache-v2` to invalidate all stale GET responses.

### 9.10 TS build errors blocking Vercel deploy

**File:** `frontend/src/hooks/usePrefetch.ts` + `frontend/src/pages/ProductsPage.tsx`

Two TypeScript errors blocked the Vercel build:

1. `usePrefetch.ts:46` — `window.setTimeout` returns `ReturnType<typeof setTimeout>` which doesn't match `useRef<number>`. Fixed by casting `window.setTimeout` through `(window as any).setTimeout`.
2. `ProductsPage.tsx:85` — TS can't track `let` variable mutations through closures (`processLine` sets `finalResult` inside a while loop). After the loop, TS narrows `finalResult` to `never`, so accessing `.errors`/`.created` fails. Fixed with type assertion.

---

## 8. Files Modified

### Backend

* `backend/internal/history/handlers.go` — closing=0 fix, cache key fix, CSV flush error fix
* `backend/internal/history/store.go` — closing=0 SQL fix
* `backend/internal/ledger/handlers.go` — cache stores full todayResponse, invalidates analytics/history on sync, dead code removed in TodayHandler
* `backend/internal/ledger/store.go` — closing=0 fix in CloseDay + autoSync + SyncFromLastClosedDay stock queries
* `backend/internal/products/handlers.go` — SSE JSON double-`}}` fix + batched import + archive/restore handlers + SSE buffering header
* `backend/internal/products/store.go` — ListArchived + Restore functions
* `backend/internal/auth/middleware_test.go` — **NEW** staff security tests

### Frontend

* `frontend/src/lib/api.ts` — errorMessage() + isNetworkError() helpers
* `frontend/src/lib/loginErrors.ts` — removed enumeration leak
* `frontend/src/pages/SettingsPage.tsx` — hide tabs for staff + errorMessage
* `frontend/src/pages/DashboardPage.tsx` — sparkline wired to real data + errorMessage
* `frontend/src/pages/HistoryPage.tsx` — mobile dialog + grid items-stretch + errorMessage
* `frontend/src/pages/ProductsPage.tsx` — errorMessage for import errors
* `frontend/src/components/dashboard/ProductsProvider.tsx` — 500 error message + restore/fetchArchived + TodayResponse type fix + errorMessage
* `frontend/src/components/dashboard/ProductsCatalog.tsx` — syncing message + archived toggle + restore button + errorMessage
* `frontend/src/components/dashboard/ProductsTable.tsx` — low-stock visibility beyond top-8
* `frontend/src/components/dashboard/DayDetailPanel.tsx` — independent desktop scroll (sticky + max-h)
* `frontend/src/components/dashboard/productsContext.ts` — restoreProduct + fetchArchived types
* `frontend/src/components/ui/DialogContent.tsx` — base dialog styles (mobile/breakpoint handling)
* `frontend/src/components/AuthProvider.tsx` — errorMessage for session errors
* `frontend/src/components/landing/HeroSection.tsx` — product-preview mockup
* `frontend/src/components/AppRoutes.tsx` — React.lazy code splitting
* `frontend/src/hooks/usePrefetch.ts` — **NEW** prefetch hook + TS fixes for Vercel build
* `frontend/src/hooks/useLedger.ts` — TodayResponse parsing + errorMessage + isNetworkError
* `frontend/src/hooks/useHistory.ts` — history API consumer + errorMessage
* `frontend/src/components/dashboard/Sidebar.tsx` — hover prefetch
* `frontend/src/components/layout/AppLayout.tsx` — idle prefetch
* `frontend/vite.config.ts` — expanded SW cache

### Scripts & CI

* `scripts/seed-test-users.sh` — **NEW** seed script
* `scripts/backup-db.sh` — updated for Turso auth token passthrough
* `.github/workflows/backup.yml` — **NEW** daily automated Turso backup

### Docs

* `FEATURE_VERIFICATION_REPORT.md` — updated with completed fixes
* `DAY_WORK_2026-07-27.md` — updated with all commits, bug fixes, and files

---

## 2026-07-22

# Day Work — 2026-07-22

## Landing page redesign & component extraction

### Auth — 24h auto-logout

* `frontend/src/components/AuthProvider.tsx` — store login timestamp in localStorage on login, check expiry on mount, auto-logout after 24 hours

### Landing page — detailed sections added

* Stats bar: "2 min", "Zero", "₦1M+" with descriptive body text, wider layout
* Problem section: manual arithmetic, end-of-day rush, lost records
* Solution section: works on any phone, no math required, data stays yours, see what matters
* Paper vs Ifesquare comparison table (6 rows, animated)
* Features: expanded from 4 to 8 (added auto-calculations, day close & history, revenue breakdown, export & print)
* How it works: 3 steps
* Who it's for: small shops, family-run businesses, distributors
* Closing CTA: wider, with gradient background

### Animations

* `hover:scale-[1.02]` + `hover:shadow-md` on all cards with spring physics
* `FadeUp` scroll-triggered animation wrapper (framer-motion)
* Comparison rows animate in from left with staggered delay
* Feature cards stagger in by index

### Wider sections

* Stats bar: removed `sm:px-[15%]` constraint
* Comparison table: `max-w-2xl` → `max-w-7xl`, removed `sm:px-[15%]`
* Closing CTA: removed `sm:px-[15%]`

### Component extraction (10 new files)

| File | Purpose |
| -- | -- |
| `frontend/src/components/landing/FadeUp.tsx` | Reusable scroll animation wrapper |
| `frontend/src/components/landing/HeroSection.tsx` | Hero with tagline, description, CTA |
| `frontend/src/components/landing/StatsSection.tsx` | Key metrics bar |
| `frontend/src/components/landing/ProblemSection.tsx` | Paper ledger pain points |
| `frontend/src/components/landing/SolutionSection.tsx` | How Ifesquare helps |
| `frontend/src/components/landing/ComparisonSection.tsx` | Paper vs Ifesquare table |
| `frontend/src/components/landing/FeaturesSection.tsx` | 8 feature cards |
| `frontend/src/components/landing/HowItWorksSection.tsx` | 3-step workflow |
| `frontend/src/components/landing/AudienceSection.tsx` | Target audience cards |
| `frontend/src/components/landing/CtaSection.tsx` | Closing call-to-action |

### Footer

* Added social links: GitHub (emanncode), X (emanncode), WhatsApp (09048801668)

### Commits

* `34be9b9` — Add 24h auto-logout to AuthProvider
* `15cfce6` — Extract landing page into section components
* `51068bd` — Refactor ComingSoonPage to use extracted section components
* `b5e498a` — Add social links to footer (GitHub, X, WhatsApp)

---

## 2026-07-19

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

---

## 2026-07-18

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


---

## 2026-07-17

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


---

## 2026-07-16

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

---

# 2026-10-13

## Summary
Major platform elevation milestone: Established multi-agent skills architecture mirroring Soldbay, transitioned to code-first workflows, anchored the 2:00 AM business day rollover to `Africa/Lagos` timezone, implemented automated day closure background worker, integrated Termii SMS with `talert` default (bypassing NCC CAC requirement), resolved Staff RBAC price leakage, delivered self-serve owner registration (`/register`), and released via 7 atomic conventional commits to `main`.

## Key Discoveries & Architectural Context
* **Nigerian Telecom Regulatory Mandate**: Custom alphanumeric Sender IDs (`Ifesquare`) require CAC Certificate of Registration per NCC rules to prevent SMS spoofing. Bypassed by using Termii's pre-approved default generic sender ID **`talert`** (`TERMII_CHANNEL="generic"`). Verified live balance: ₦30.00 NGN under `EmannCode`.
* **Production Hosting Stack**:
  * Backend API: Go 1.26 on **Render**
  * Database: Cloud libSQL on **Turso** (AWS EU-West-1)
  * Frontend: React 19 SPA on **Vercel** (`https://ifesquare.uniflowapp.xyz`)
* **Timezone Anchoring**: Shifted `db.GetToday()` calculation to `Africa/Lagos` (WAT) to prevent UTC server drift.
* **Automated Closure**: Background worker in `worker.go` auto-finalizes yesterday's unclosed ledgers between 2:02 AM–2:30 AM WAT, auto-fills null closing to `Opening + Receipts` (0 sales), and dispatches dual SMS/email notifications.
* **Staff RBAC Confidentiality**: Redacted product prices on backend (`entry.Price = 0`) for staff role in `TodayHandler`.
* **Self-Serve SaaS**: Mounted `POST /api/auth/register`, built `/register` page, connected landing page CTAs, and added first-run dashboard setup banner.

## Commits Pushed to Remote
| Hash | Type | Summary |
|---|---|---|
| `7c8abeb` | chore | setup agent ecosystem (22 skills), code-first rules, and Linear sync tooling |
| `e13993b` | feat | anchor business day rollover to Africa/Lagos timezone; migration 011 |
| `617121e` | feat | add background worker for automated day closure at 2:02 AM WAT |
| `5f73ff1` | feat | integrate Termii SMS client with talert default and configurable channel |
| `1e0c944` | test | add core ledger test suite and enforce staff price redaction |
| `d0b89bc` | feat | add self-serve store registration and onboarding flow |
| `b8dc63f` | docs | update README and technical change logs |


---
name: allonifesquare
description: Master product context, architecture, discovery, and implementation guidelines for the Ifesquare inventory and daily ledger platform.
---

# AllOnIfesquare Agent Skill

## Product Context & Linear Reference

Ifesquare is a modern shop inventory and daily ledger management system built to replace handwritten paper ledgers for small retail businesses and supermarkets.

- **Linear Project**: https://linear.app/emanncode/project/ifesquare-6b11239c548c/overview
- **Project ID**: `6b11239c548c` (UUID: `db6b2bc5-f866-44e9-8a52-516c40f3792c`)
- **Working Source of Truth**: The Linear Project Documents, `.agents/skills/`, and `docs/`.

---

## Core Philosophy & Business Logic Invariants

Small retail shops traditionally log stock and sales in a paper notebook at the end of each shift. Ifesquare digitizes this workflow while maintaining zero friction and high trust.

### 1. Daily Ledger Snapshots
Every business day is represented by an active ledger day containing line items for catalog products:
- **Opening Stock**: Auto-carried over from the previous closed day's closing stock.
- **Receipts**: New stock delivered/received during the current business day.
- **Closing Stock**: Physical count of stock remaining at the end of the day.
- **Units Sold**: Calculated as `Opening + Receipts - Closing`.
- **Sales Revenue**: Calculated as `Units Sold * Product Price`.

### 2. Business Day Rollover (2:00 AM Local Time)
- The business day **does not rollover at midnight**.
- To accommodate retail shops that operate late into the night, the business day rolls over at **2:00 AM local time**.
- Any activity between 12:00 AM and 1:59 AM belongs to the previous business day's ledger.
- Always respect this rollover logic in both backend calculations (`internal/ledger`) and frontend date formatters.

### 3. Closing a Business Day
When the Owner closes a business day:
1. **Auto-Fill Blank Counts**: Any blank/null closing counts are automatically populated with `Opening + Receipts` (implying 0 sales for that item).
2. **Master Stock Sync**: Master product inventory levels are updated in a single atomic transaction to equal the closing counts.
3. **Ledger Lock & Archive**: The day is finalized and archived as read-only history.
4. **Owner Notification**: An SMS summary (total revenue, total units sold, top product, low stock alerts) is automatically dispatched to the owner's phone via the Termii SMS API.

### 4. Role-Based Access Control (RBAC)
- **Owner**: Complete system authority. Manages product catalog, prices, history, analytics (MoM comparisons, revenue charts), staff user accounts, audit logs, and day close.
- **Staff**: Heavily restricted. Can **only** see the current business day's ledger table to enter receipts and closing stock counts. All product prices, revenue numbers, history pages, analytics cards, settings, and day close buttons are strictly hidden on both client and API levels.

---

## Technical Stack & Surfaces

### Backend (`backend/`)
- **Language**: Go 1.26
- **Router**: Chi HTTP Router (`chi/v5`)
- **Authentication**: JWT token issued in an `httpOnly`, `Secure`, `SameSite=Lax` cookie with bcrypt password hashing.
- **Database**: SQLite local file (`backend/data/dev.db`) or Turso / libSQL in cloud production.
- **Migrations**: 8 embedded SQL migrations run automatically on startup (`backend/internal/db/migrations/`).
- **Connection Pool**: `MaxOpenConns: 10`, `MaxIdleConns: 10`.
- **Performance Caching**: In-memory response cache for read endpoints with write-invalidation; in-memory auth revocation token cache.
- **Notification**: Termii SMS integration for automated closing summary dispatches.

### Frontend (`frontend/`)
- **Framework**: React 19, TypeScript, Vite 8
- **Styling**: Tailwind CSS v4, shadcn/ui, Radix UI primitives, Lucide React icons
- **Data Visualization**: Recharts (Revenue trend, MoM comparisons, top products)
- **Animation**: Framer Motion
- **PWA & Offline-First**: `vite-plugin-pwa` with Workbox caching, service worker auto-update, and IndexedDB mutation queue (`idb`) to allow offline receipt/count recording and automatic background synchronization upon reconnection.

---

## Development & Implementation Rules

1. **Code-First Development**:
   - Pencil design-first workflow is retired. Implement directly in application code (`backend/` and `frontend/`).
   - Reuse existing design tokens, Tailwind v4 classes, and shadcn/ui components in `frontend/src/components/ui/`.
   - Never invent arbitrary raw styles or duplicate primitive components.

2. **Mandatory Granular Technical File Logging**:
   - On **every file modified or created**, agents must provide an explicit breakdown covering:
     - Exact file path and purpose
     - Technologies, libraries, and dependencies used
     - Styling, layout, and Tailwind tokens applied
     - Functional logic, state handling, and database operations
     - Invariants verified
   - Record this breakdown in `docs/tech-logs/YYYY-MM-DD.md` and sync it to the dedicated Linear document (`YYYY-MM-DD — Technical File Log`) using `node scripts/log_tech_linear.js docs/tech-logs/YYYY-MM-DD.md`.

3. **Invariable Verification**:
   - Backend verification: `go test ./...` in `backend/`
   - Frontend verification: `npx tsc --noEmit` and `npm run lint` in `frontend/`

# Ifesquare

Ifesquare is a modern shop inventory and daily ledger management system built to replace handwritten stock ledgers for small retail shops. It features a Go backend API server and a React PWA frontend client with an offline-first architecture, role-based access control, and real-time dashboard analytics.

---

## 🚀 Core Philosophy & Business Logic

Small retail businesses traditionally record inventory and sales manually in a daily paper ledger. Ifesquare digitizes this process with a structured, reliable data model:

1. **Daily Ledger Snapshots**: Each business day acts as a ledger recording:
   * **Opening Stock**: Auto-carried over from the previous closed day's closing stock.
   * **Receipts**: New stock received during the day.
   * **Closing Stock**: The remaining stock count at the end of the day.
   * **Sales & Revenue**: Auto-calculated as `(Opening + Receipts - Closing) * Price`.
2. **Business Day Rollover (2:00 AM)**: To accommodate shops that stay open past midnight, the business day rolls over at **2:00 AM** local time. Any activity before 2:00 AM is recorded as part of the previous day's ledger.
3. **Closing a Day**: When the owner closes a day:
   * Any empty/null closing stock values are auto-filled to `Opening + Receipts` (implying 0 sales for that product).
   * The products' master stock levels are updated to match the day's closing stock values.
   * The ledger day is finalized and locked (archived to read-only history).
   * A summary SMS notification (total revenue, units sold, top product, low stock alerts) is automatically sent to the owner via the Termii SMS API.

---

## 👥 Role-Based Access Control (RBAC)

The application supports two distinct roles to prevent staff from viewing sensitive financial data:

* **Owner**: Full access to the system. Can manage the product catalog, edit history records, view detailed revenue charts and MoM comparisons, add/deactivate staff accounts, view audit logs, and close out the day.
* **Staff**: Restricted access. Can only view the current business day's ledger table to record receipts and closing counts. All prices, revenues, history records, settings, and charts are completely hidden.

---

## 🛠️ Technology Stack

### Backend
* **Language**: Go 1.26
* **Routing**: Chi HTTP Router (v5)
* **Authentication**: JWT token issued in an `httpOnly` secure cookie with bcrypt password hashing
* **Rate Limiting**: Sliding-window rate limiter for logins (5 attempts per email per 15 minutes)
* **Response Cache**: High-performance in-memory cache for API read endpoints with automatic write-invalidation

### Frontend
* **Core**: React 19, TypeScript, Vite 8
* **Styling**: Tailwind CSS 4, shadcn/ui, Radix UI primitives
* **Charts**: Recharts (Bar, Pie, Line charts)
* **Animations**: Framer Motion
* **PWA**: `vite-plugin-pwa` with Workbox caching and service worker auto-update
* **Offline Storage**: IndexedDB mutation queue using `idb` for queuing offline updates and auto-syncing when connection restores

### Database
* **Database Engine**: SQLite (local file) or Turso / libSQL (production cloud)
* **Schema Migrations**: 8 embedded SQL migrations run automatically on boot

---

## 📂 Repository Structure

```
ifesquare/
├── backend/                   # Go backend server
│   ├── cmd/server/            # Server entrypoint & CLI commands
│   ├── internal/
│   │   ├── analytics/         # Month-over-month revenue comparison
│   │   ├── audit_log/         # User action logging
│   │   ├── auth/              # JWT issuance, verification & middlewares
│   │   ├── cache/             # In-memory response cache
│   │   ├── db/                # DB connections & SQL migrations
│   │   ├── history/           # Closed ledger retrieval and csv exports
│   │   ├── ledger/            # Active ledger CRUD and Close-Day transaction
│   │   ├── notify/            # Termii SMS service integration
│   │   ├── products/          # Catalog management & import handlers
│   │   └── users/             # Staff account creation and deactivation
│   ├── go.mod
│   └── README.md
├── frontend/                  # React client application
│   ├── src/
│   │   ├── components/        # Reusable UI elements, metric cards, charts
│   │   ├── hooks/             # Custom state & API hooks
│   │   ├── lib/               # API wrappers, offline queue, format utils
│   │   ├── main.tsx
│   │   └── App.tsx
│   ├── package.json
│   └── vite.config.ts
├── design/                    # UI mockups and design frames (.pen files)
├── full_on_feature.md         # Comprehensive feature specification
└── README.md                  # Public overview documentation
```

---

## ⚙️ Local Development Setup

### Prerequisites
* Go 1.26 or higher
* Node.js 18 or higher

### 1. Set Up the Backend
Navigate to the `backend` directory, create a `.env` file, and populate the environment variables:

```bash
cd backend
cp .env.example .env  # or create one manually
```

Required variables in `backend/.env`:
```ini
PORT=8080
JWT_SECRET="your-jwt-signing-secret"
DB_PATH="./ifesquare.db"  # Path to SQLite database file
# For production (Turso cloud db):
# TURSO_DATABASE_URL="libsql://your-db.turso.io"
# TURSO_AUTH_TOKEN="your-token"
```

Run database seeding or create the first owner user:
```bash
ADMIN_EMAIL=owner@example.com ADMIN_PASSWORD=secretpassword go run ./cmd/server -create-user owner@example.com
```

Run the backend server in development mode:
```bash
go run ./cmd/server
```
The backend server will list on `http://localhost:8080`.

### 2. Set Up the Frontend
Navigate to the `frontend` directory and install dependencies:

```bash
cd ../frontend
npm install
```

Start the Vite development server:
```bash
npm run dev
```
The frontend will be available at `http://localhost:5173`. Open it in your browser and sign in with the owner credentials you created.

---

## 🧪 Running Tests

* **Backend Tests**: Run `go test ./...` in the `backend/` directory.
* **Frontend Tests**: Run `npm test` in the `frontend/` directory.

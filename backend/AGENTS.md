# Go Backend Agent Rules — Ifesquare

## Go 1.26 + Chi v5 Environment

All backend code lives in `backend/` and follows standard Go idioms and project conventions.

### Architectural Rules
- **Package Organization**: Modular packages inside `internal/` (`ledger`, `products`, `auth`, `cache`, `history`, `analytics`, `notify`, `users`, `audit_log`, `db`).
- **Database Pool**: SQLite dev (`backend/data/dev.db`) or Turso libSQL in production. Pool settings: `MaxOpenConns: 10`, `MaxIdleConns: 10`.
- **Database Migrations**: Embedded in `internal/db/migrations/`. Do not perform ad-hoc SQL schema edits outside of migration files.
- **Atomic Transactions**: Day closing logic (`CloseDay`) must be wrapped in `tx, err := db.BeginTx(ctx, nil)`.
- **Response Caching**: Any mutation endpoint must invalidate associated cache keys via `internal/cache`.
- **RBAC Enforcement**: Verify JWT user role on all endpoints. Staff cannot access prices, revenues, catalog alterations, or user administration.

### Mandatory Technical Changelog
Document every backend file modified or created (packages used, queries, endpoints, invariants) in `docs/tech-logs/YYYY-MM-DD.md` and sync via:
```bash
node ../scripts/log_tech_linear.js ../docs/tech-logs/YYYY-MM-DD.md
```

### Verification
```bash
go test ./...
go build -o bin/server ./cmd/server
```

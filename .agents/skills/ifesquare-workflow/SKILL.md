---
name: ifesquare-workflow
description: Standard development lifecycle, testing procedures, and Pencil MCP workflow for Ifesquare.
---

# Development Workflow for Ifesquare

Follow this process for adding features, refactoring, or fixing bugs in Ifesquare.

---

## 1. Feature Lifecycle

1. **Clarify Scope & Business Impact**:
   - Determine whether the change affects the ledger snapshot, pricing, staff permissions, or offline syncing.
2. **Design First (For Visual Work)**:
   - If introducing or modifying screens, update or create frames in `design/*.pen` using Pencil MCP tools (`get_editor_state`, `batch_design`).
   - Request and secure explicit user approval before touching frontend application code.
3. **Backend First Implementation**:
   - Create SQL migration in `backend/internal/db/migrations/` if schema changes are required.
   - Implement data store operations with transactions and proper error propagation.
   - Add HTTP handlers in `internal/<feature>/handlers.go` and mount routes in Chi router.
   - Enforce RBAC checks and invalidate in-memory cache on writes.
   - Write comprehensive Go unit and table-driven tests.
4. **Frontend Integration**:
   - Update `frontend/src/lib/types.ts` to reflect API payloads.
   - Add/update endpoints in `frontend/src/lib/api.ts`.
   - Wire up offline queueing if the action is usable without active internet.
   - Implement components conforming to approved designs.
5. **Quality Verification**:
   - Run backend tests: `go test ./...` in `backend/`.
   - Run frontend tests: `npm test` in `frontend/`.
   - Verify build integrity: `npm run build` in `frontend/`.

---

## 2. Testing Guidelines

### Backend Testing (`backend/`)
* Use `net/http/httptest` to verify HTTP handlers and response codes.
* Use in-memory SQLite (`:memory:`) or isolated test databases with schema migrations run before test suites.
* Ensure RBAC tests verify that staff tokens receive 403 Forbidden on owner routes and redacted data on ledger reads.

### Frontend Testing (`frontend/`)
* Use Vitest and React Testing Library for component behavior tests.
* Test offline queue addition and replay logic under network disconnection scenarios.


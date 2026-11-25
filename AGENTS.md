# Agent Rules — Ifesquare

## Development Workflow: Code-First
Implement directly in application code (`backend/` and `frontend/`) using existing design tokens, components, and patterns. (Pencil design-first gate is retired).

## Local Technical File Logging
For **every file modified or created during a task**, agents document locally:
1. Exact file path and functional purpose.
2. Technologies, libraries, and dependencies used.
3. Styling, Tailwind v4 tokens, and UI layout applied.
4. Business logic, state changes, error handling, and API contracts.
5. Invariants verified (RBAC, 2 AM rollover, offline queue, atomic transactions).

Append this breakdown to `docs/tech-logs/YYYY-MM-DD.md` for code-adjacent implementation history. Do not sync this technical log into a Linear document. Linear is reserved for implementation issues and execution status; durable product/system decisions and reusable build insights belong in Notion. If a durable decision changes, update the canonical Notion reference and link it from the relevant Linear issue.

## Agent Skills Reference
Comprehensive domain context lives in `.agents/skills/`:
- `allonifesquare`: Master entry skill, product context, invariants, and workflows.
- `ifesquare-ai-instructions`: Coding rules, safekeeping, and invariant enforcement.
- `ifesquare-tech-logging`: Specification and template for granular file logging.
- `ifesquare-feature-specification`: Full feature specification, API endpoints, and schema.
- `ifesquare-design`: Styling tokens, components, and design system.
- `ifesquare-backend`: Go backend architecture, caching, and migrations.
- `ifesquare-frontend`: React 19, Tailwind v4, PWA, and offline IndexedDB sync.
- `ifesquare-daily-logs`: Chronological implementation history from Linear.

## Notion and Linear responsibilities
Use Notion as the canonical durable home for Ifesquare product/system context, requirements, workflows, research, and decisions. Use the [Ifesquare Linear project](https://linear.app/emanncode/project/ifesquare-6b11239c548c/overview) for implementation issues, bugs, ownership, priority, status, and releases. Search for the existing Notion project page before creating or revising durable docs. Existing Linear documents are not authoritative merely because older instructions call them a source of truth.

## Core Business Invariants
1. **2:00 AM Rollover**: Business day rolls over at 2:00 AM local time (not midnight). Activity before 2:00 AM belongs to the prior day.
2. **Daily Ledger Calculation**: Sales = `(Opening + Receipts - Closing) * Price`.
3. **Closing a Day**: Auto-fills empty closing counts to `Opening + Receipts` (0 sales), updates master stock, locks day, sends Termii SMS.
4. **RBAC**: Owner has full access; Staff is strictly restricted to current day ledger table (prices, revenue, history, settings completely hidden).

## Verification Commands
- **Backend**: `cd backend && go test ./...`
- **Frontend**: `cd frontend && npx tsc --noEmit && npm run lint`

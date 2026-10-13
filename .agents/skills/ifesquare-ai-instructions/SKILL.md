---
name: ifesquare-ai-instructions
description: Strict instructions, code retention rules, invariants, and architectural guidelines for AI coding assistants working in Ifesquare.
---

# Ifesquare AI Coding Instructions

This document is written specifically for AI coding assistants working in the Ifesquare repository. **Read these instructions carefully before proposing or executing code changes.**

---

## 1. Architecture & Code Retention

- **Preserve Project Structure**: Never move, rename, or delete existing files or directories unless explicitly instructed. Keep backend modules under `backend/internal/` and frontend modules under `frontend/src/`.
- **Surgical Changes**: Avoid wholesale deletions of existing logic, helper functions, or debug instrumentation. Edits must be additive or cleanly targeted.
- **Preserve Comments & Documentation**: Do not remove existing docstrings, Go comments, TypeScript JSDoc blocks, or schema comments.
- **Maintain Invariants**:
  - **2:00 AM Rollover**: Day rollover is strictly 2:00 AM local time, never midnight (1:59 AM is part of the previous day).
  - **Closing Calculation**: Blank counts must auto-fill to `Opening + Receipts` (0 sales).
  - **RBAC**: Staff must never receive product prices, margins, revenue figures, or history from either the API or the UI.

---

## 2. Development Safekeeping & Code Quality

### Frontend (React 19 + TypeScript + Vite 8 + Tailwind v4)
- **Do Not Invent UI Primitives**:
  - Leverage existing shadcn/ui components (`frontend/src/components/ui/`) and Radix primitives.
  - Never introduce parallel raw button, input, dialog, or dropdown implementations.
  - Reuse Tailwind CSS v4 variables and theme tokens.
- **Strict TypeScript**:
  - Never use `any`, `unknown` without type guards, or `@ts-ignore` / `@ts-nocheck`.
  - Type all API payloads, responses, state hooks, and component props explicitly.
- **State & Offline Storage**:
  - Do not pollute global state.
  - Maintain offline-first mutations using the `idb` IndexedDB queue (`frontend/src/lib/offlineQueue.ts`). Ensure offline state displays clear visual indicators.
- **Static Validation**:
  - Every frontend change must pass `npx tsc --noEmit` and `npm run lint`.

### Backend (Go 1.26 + Chi v5 + SQLite / Turso)
- **Idiomatic Go**:
  - Organize packages under `backend/internal/` with clear responsibility separation (`ledger`, `products`, `auth`, `cache`, `history`, `analytics`, `notify`, `users`, `audit_log`).
  - Always handle errors explicitly. Never discard errors with `_ = ...` unless deliberate and commented.
- **Database & Transactions**:
  - SQLite local (`backend/data/dev.db`) and Turso cloud production.
  - The day closing operation (`CloseDay`) must execute inside an atomic database transaction (`tx, err := db.Begin()`), updating ledger line items, master products, and archiving the snapshot atomically.
- **Response Caching**:
  - Respect the in-memory response cache in `backend/internal/cache/`. Ensure any mutation endpoint invalidates the relevant cache keys.
- **Testing**:
  - Run `go test ./...` in `backend/` to verify zero regressions.

---

## 3. Mandatory Granular Technical File Logging Rule

On **every single file modified or created during a coding session**, agents MUST provide an explicit, technical breakdown containing:
1. **File Path**: Relative path of the file.
2. **Purpose**: The architectural role of the file and reason for modification.
3. **Technologies & Libraries**: Explicit imports, packages, frameworks, or APIs utilized.
4. **Styling & Design Tokens**: Tailwind CSS classes, shadcn/ui variants, layout structures, and tokens applied.
5. **Logic, State & Flow**: Functions altered, algorithms, query parameters, state hooks, or error handlers.
6. **Invariants & Safety**: RBAC checks, 2 AM rollover alignment, offline queue compatibility, or transaction boundaries.

### Logging Execution Protocol:
- Staged locally in `docs/tech-logs/YYYY-MM-DD.md`.
- Synced to Linear's separate daily technical document (`YYYY-MM-DD — Technical File Log`) via:
  ```bash
  node scripts/log_tech_linear.js docs/tech-logs/YYYY-MM-DD.md
  ```
- This technical log is separate from the high-level daily progress reports.

---

## 4. Database Migrations

- The database schema is versioned via 8 embedded SQL migrations in `backend/internal/db/migrations/`.
- Never execute manual ad-hoc DDL scripts directly against production or test databases.
- When introducing schema changes, create a new sequential migration file (`009_*.sql`) and run the embedded migration runner.

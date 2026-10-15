---
name: ifesquare-workflow
description: Current implementation and verification workflow for Ifesquare.
---

# Ifesquare Development Workflow

1. Identify affected ledger, RBAC, cache, offline-queue, and rollover invariants before coding.
2. Implement directly in `backend/` and `frontend/` using existing components, tokens, and patterns. The former Pencil design-first gate is retired.
3. Put schema changes in a new embedded migration; wrap close-day behavior in a transaction; invalidate cache after writes.
4. Keep staff restrictions enforced in the API as well as the interface.
5. For every modified or created file, append the required technical breakdown to `docs/tech-logs/YYYY-MM-DD.md`, then sync the log to its Linear document with `node scripts/log_tech_linear.js docs/tech-logs/YYYY-MM-DD.md`.
6. Verify relevant work with `go test ./...` in `backend/` and `npx tsc --noEmit`, `npm run lint`, and `npm run build` in `frontend/`.

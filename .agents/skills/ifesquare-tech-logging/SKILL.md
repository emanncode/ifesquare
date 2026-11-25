---
name: ifesquare-tech-logging
description: Standard protocol and format for logging granular file-by-file technical explanations in the repository's local technical daily log.
---

# Ifesquare Granular Technical File Logging Protocol

## Purpose

To maintain an exhaustive, high-fidelity audit trail of engineering decisions, code alterations, styling implementations, and technical dependencies across the Ifesquare codebase, all coding agents must log detailed file breakdowns for every session.

This technical log is maintained in the repository at `docs/tech-logs/YYYY-MM-DD.md` as code-adjacent implementation history. It is not a Linear document. Durable product decisions and reusable knowledge belong in Notion; Linear tracks execution.

---

## File Breakdown Schema

For each file added or modified during a session, format an entry using this structure:

```markdown
### `[MODIFY | NEW | DELETE] <path/to/file.ext>`

- **Purpose & Architectural Role**:
  Brief description of what this file does in the system and why it was modified in this session.

- **Technologies, Libraries & Packages**:
  Explicit packages, libraries, standard library modules, or external APIs imported or utilized (e.g., `chi/v5`, `database/sql`, `Radix UI Dialog`, `idb`, `recharts`, `lucide-react`, `bcrypt`).

- **Styling, Tokens & Layout (Frontend)**:
  Tailwind CSS v4 utility classes, CSS variables, typography classes (`text-sm`, `font-semibold`), component variants (`default`, `outline`, `destructive`), grid/flex layouts, responsive breakpoints, and animations applied. (Skip for non-UI/backend files).

- **Logic, Algorithms & State**:
  Key algorithms, state hooks (`useState`, `useReducer`, `useMemo`), event handlers, database queries, transactions, route registrations, caching invalidations, or network payloads implemented or touched.

- **Invariants & Security Checked**:
  Explicit verification of RBAC boundaries (Owner vs Staff data leakage prevention), 2:00 AM business day rollover safety, offline IndexedDB sync compatibility, or database transaction atomicity.
```

---

## Logging Procedure

1. **Staging**: At the conclusion of modifying code files, append or write the entries into `docs/tech-logs/YYYY-MM-DD.md`.
2. **Do not dispatch to Linear**: The `scripts/log_tech_linear.js` integration is legacy and must not be run for new work. Existing historical Linear technical logs remain historical records.
3. **Walkthrough Inclusion**: Reference the logged file changes in your session walkthrough.

---
name: ifesquare-tech-logging
description: Standard protocol, format specification, and tooling for logging granular file-by-file technical explanations to the separate Linear technical daily document.
---

# Ifesquare Granular Technical File Logging Protocol

## Purpose

To maintain an exhaustive, high-fidelity audit trail of engineering decisions, code alterations, styling implementations, and technical dependencies across the Ifesquare codebase, all coding agents must log detailed file breakdowns for every session.

This technical log is maintained in a **dedicated, separate Linear daily document** (distinct from standard high-level daily progress summaries):
- **Linear Document Title Format**: `YYYY-MM-DD — Technical File Log`
- **Local Mirror**: `docs/tech-logs/YYYY-MM-DD.md`

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
2. **Dispatch to Linear**: Run the logging script:
   ```bash
   node scripts/log_tech_linear.js docs/tech-logs/YYYY-MM-DD.md
   ```
   The script checks if `YYYY-MM-DD — Technical File Log` already exists in the Linear project:
   - If it exists, it appends the new entry with a clear separator (`---`).
   - If not, it creates the new Linear document under project `ifesquare` (`6b11239c548c`).
3. **Walkthrough Inclusion**: Reference the logged file changes in your session walkthrough.

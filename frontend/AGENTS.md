# React Frontend Agent Rules — Ifesquare

## React 19 + Vite 8 + Tailwind CSS v4 Environment

All frontend code lives in `frontend/` and follows strict TypeScript and offline-first PWA standards.

### Architectural Rules
- **No Raw UI Primitives**: Use existing shadcn/ui components in `src/components/ui/` and Radix UI primitives.
- **Strict TypeScript**: Do not use `any` or `@ts-ignore`. Explicitly type all component props, API interfaces, and state.
- **Styling**: Tailwind CSS v4 utility classes and CSS variables in `src/index.css`. Maintain high contrast and mobile touch accessibility.
- **Offline Mutation Queue**: Persist pending operations in IndexedDB via `src/lib/offlineQueue.ts` using the `idb` library. Update UI optimistically and drain queue upon `online` events.
- **RBAC Security**: Enforce role-based routing (`App.tsx`). Staff must never have access to price columns, revenue totals, products catalog, or settings pages.

### Mandatory Technical Changelog
Document every frontend file modified or created (components, styling tokens, hooks, offline handling) in `docs/tech-logs/YYYY-MM-DD.md` and sync via:
```bash
node ../scripts/log_tech_linear.js ../docs/tech-logs/YYYY-MM-DD.md
```

### Verification
```bash
npx tsc --noEmit
npm run lint
npm run build
```

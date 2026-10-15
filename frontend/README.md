# Ifesquare Frontend

The frontend is a React 19, TypeScript, Vite 8 progressive web app for the Ifesquare retailer ledger.

## Routes

- `/`: public product page; it renders without waiting for an authenticated-session request.
- `/register`: self-serve owner account creation and initial store details.
- `/login`: existing account access.
- `/app`: current business-day ledger.
- `/app/products`, `/app/history`, `/app/settings`: owner-only catalog, history, and administration surfaces.

Staff accounts are redirected away from owner-only routes. Financial data must remain hidden in both the interface and the API payload.

## Offline behavior

Supported mutations are queued in IndexedDB when the network is unavailable and replayed when it returns. The queue coordinates multiple browser tabs with Web Locks and BroadcastChannel. Closing a day, CSV operations, and notification delivery require an active connection.

## Start and verify

```bash
npm install
npm run dev
npx tsc --noEmit
npm run lint
npm run build
```

Set `VITE_API_URL` only when the API is hosted on a different origin. Local Vite development proxies `/api` to `http://localhost:8080`.

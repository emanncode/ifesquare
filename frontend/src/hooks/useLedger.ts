import { useCallback, useEffect, useMemo, useState } from "react"
import { api, errorMessage, isNetworkError } from "@/lib/api"
import { deriveLedgerRow, type ApiLedgerEntry, type LedgerRow, type TodayResponse } from "@/lib/types"
import { useAuth } from "@/hooks/useAuth"

function safeEntries(data: TodayResponse | unknown): ApiLedgerEntry[] {
  if (Array.isArray(data)) return data
  if (data && typeof data === "object" && Array.isArray((data as TodayResponse).entries)) {
    return (data as TodayResponse).entries
  }
  return []
}

function safeClosedAt(data: TodayResponse | unknown): string | null {
  if (data && typeof data === "object" && !Array.isArray(data)) {
    return (data as TodayResponse).closed_at ?? null
  }
  return null
}

/**
 * Today's ledger from GET /api/ledger/today (+ close day).
 * Backend returns { entries, closed_at }; we derive sales/amount client-side.
 */
export function useLedger() {
  const { isAuthenticated } = useAuth()
  const [entries, setEntries] = useState<ApiLedgerEntry[]>([])
  const [loading, setLoading] = useState(isAuthenticated)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState(() => new Date())
  const [closedAt, setClosedAt] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!isAuthenticated) return
    const data = await api<TodayResponse>("/api/ledger/today")
    setEntries(safeEntries(data))
    setClosedAt(safeClosedAt(data))
    setLastUpdated(new Date())
  }, [isAuthenticated])

  useEffect(() => {
    if (!isAuthenticated) return
    let cancelled = false
    void (async () => {
      try {
        const data = await api<TodayResponse>("/api/ledger/today")
        if (!cancelled) {
          setEntries(safeEntries(data))
          setClosedAt(safeClosedAt(data))
          setError(null)
          setLastUpdated(new Date())
        }
      } catch (err) {
        if (!cancelled) {
          setError(errorMessage(err, "Failed to load ledger"))
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [isAuthenticated])

  // Re-pull server truth once the offline queue has been fully replayed.
  useEffect(() => {
    function onSync() {
      void load()
    }
    window.addEventListener("app-data-sync", onSync)
    return () => window.removeEventListener("app-data-sync", onSync)
  }, [load])

  const refresh = useCallback(async () => {
    if (!isAuthenticated) return
    setLoading(true)
    setError(null)
    try {
      await load()
    } catch (err) {
      setError(errorMessage(err, "Failed to load ledger"))
    } finally {
      setLoading(false)
    }
  }, [load, isAuthenticated])

  const closeDay = useCallback(async () => {
    try {
      await api("/api/ledger/close", { method: "POST" })
    } catch (err) {
      if (isNetworkError(err)) {
        throw new Error("Can't close the day while offline — reconnect and try again.", { cause: err })
      }
      throw err
    }
    await load()
  }, [load])

  const rows: LedgerRow[] = useMemo(
    () => (entries ?? []).map(deriveLedgerRow),
    [entries],
  )

  const date = entries[0]?.day_date ?? new Date().toISOString().slice(0, 10)
  const isDayClosed = closedAt !== null

  return {
    date,
    rows,
    entries,
    loading,
    error,
    lastUpdated,
    isDayClosed,
    refresh,
    closeDay,
  }
}

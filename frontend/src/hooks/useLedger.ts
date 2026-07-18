import { useCallback, useEffect, useMemo, useState } from "react"
import { api } from "@/lib/api"
import { deriveLedgerRow, type ApiLedgerEntry, type LedgerRow } from "@/lib/types"
import { useAuth } from "@/hooks/useAuth"

/**
 * Today's ledger from GET /api/ledger/today (+ close day).
 * Backend returns a flat array of entries; we derive sales/amount client-side.
 */
export function useLedger() {
  const { isAuthenticated } = useAuth()
  const [entries, setEntries] = useState<ApiLedgerEntry[]>([])
  const [loading, setLoading] = useState(isAuthenticated)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState(() => new Date())

  const load = useCallback(async () => {
    if (!isAuthenticated) return
    const data = await api<ApiLedgerEntry[]>("/api/ledger/today")
    setEntries(data ?? [])
    setLastUpdated(new Date())
  }, [isAuthenticated])

  useEffect(() => {
    if (!isAuthenticated) return
    let cancelled = false
    void (async () => {
      try {
        const data = await api<ApiLedgerEntry[]>("/api/ledger/today")
        if (!cancelled) {
          setEntries(data ?? [])
          setError(null)
          setLastUpdated(new Date())
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load ledger")
          setEntries([])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [isAuthenticated])

  const refresh = useCallback(async () => {
    if (!isAuthenticated) return
    setLoading(true)
    setError(null)
    try {
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load ledger")
    } finally {
      setLoading(false)
    }
  }, [load, isAuthenticated])

  const closeDay = useCallback(async () => {
    try {
      await api("/api/ledger/close", { method: "POST" })
    } catch (err) {
      if (!(err instanceof Error) || err.name === "TypeError") {
        throw new Error("Can't close the day while offline — reconnect and try again.")
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

  return {
    date,
    rows,
    entries,
    loading,
    error,
    lastUpdated,
    refresh,
    closeDay,
  }
}

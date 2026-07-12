import { useCallback, useEffect, useState } from "react"
import { api } from "@/lib/api"
import type { TodayLedger } from "@/lib/types"

/**
 * Today's ledger: load, patch a product row, and close the day.
 * Ready for milestone 7 once the ledger API is live.
 */
export function useLedger() {
  const [ledger, setLedger] = useState<TodayLedger | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await api<TodayLedger>("/api/ledger/today")
      setLedger(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load ledger")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const patchEntry = useCallback(
    async (
      productId: number,
      patch: { receipts?: number; closing?: number | null }
    ) => {
      const data = await api<TodayLedger>(`/api/ledger/today/${productId}`, {
        method: "PATCH",
        body: patch,
      })
      setLedger(data)
      return data
    },
    []
  )

  const closeDay = useCallback(async () => {
    const data = await api<TodayLedger>("/api/ledger/close", { method: "POST" })
    setLedger(data)
    return data
  }, [])

  return {
    ledger,
    loading,
    error,
    refresh,
    patchEntry,
    closeDay,
  }
}

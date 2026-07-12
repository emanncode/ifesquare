import { useCallback, useEffect, useState } from "react"
import { api } from "@/lib/api"
import type { HistoryDayDetail, HistoryDaySummary } from "@/lib/types"

/**
 * Closed-day history list + optional day detail.
 * Ready for milestone 9 once the history API is live.
 */
export function useHistory(limit = 30) {
  const [days, setDays] = useState<HistoryDaySummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await api<HistoryDaySummary[]>(
        `/api/history?limit=${limit}`
      )
      setDays(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load history")
    } finally {
      setLoading(false)
    }
  }, [limit])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const getDay = useCallback(async (date: string) => {
    return api<HistoryDayDetail>(`/api/history/${date}`)
  }, [])

  return {
    days,
    loading,
    error,
    refresh,
    getDay,
  }
}

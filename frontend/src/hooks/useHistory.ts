import { useCallback, useEffect, useState } from "react"
import { api } from "@/lib/api"
import type { ApiHistoryDayDetail, ApiHistoryDaySummary } from "@/lib/types"

/**
 * Closed-day history from GET /api/history and GET /api/history/:date.
 */
export function useHistory(limit = 30) {
  const [days, setDays] = useState<ApiHistoryDaySummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const data = await api<ApiHistoryDaySummary[]>(
          `/api/history?limit=${limit}`,
        )
        if (!cancelled) {
          setDays(data ?? [])
          setError(null)
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load history",
          )
          setDays([])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [limit])

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await api<ApiHistoryDaySummary[]>(
        `/api/history?limit=${limit}`,
      )
      setDays(data ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load history")
    } finally {
      setLoading(false)
    }
  }, [limit])

  const getDay = useCallback(async (date: string) => {
    return api<ApiHistoryDayDetail>(`/api/history/${date}`)
  }, [])

  return {
    days,
    loading,
    error,
    refresh,
    getDay,
  }
}

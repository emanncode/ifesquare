import { useCallback, useRef } from "react"
import { api } from "@/lib/api"
import type { ApiHistoryDaySummary, MonthlyComparison } from "@/lib/types"

const prefetched = new Set<string>()

function prefetch<T>(key: string, fetcher: () => Promise<T>): void {
  if (prefetched.has(key)) return
  prefetched.add(key)
  void fetcher()
}

export function clearPrefetchCache(): void {
  prefetched.clear()
}

/**
 * Prefetch page data on hover/idle so navigation feels instant.
 */
export function usePrefetch() {
  const raf = useRef<ReturnType<typeof setTimeout> | number>(0)

  const prefetchDashboard = useCallback(() => {
    prefetch("ledger", () => api("/api/ledger/today"))
    prefetch("analytics", () => api<MonthlyComparison>("/api/analytics/monthly-comparison"))
  }, [])

  const prefetchProducts = useCallback(() => {
    prefetch("products", () => api("/api/products"))
  }, [])

  const prefetchHistory = useCallback(() => {
    prefetch("history", () => api<ApiHistoryDaySummary[]>("/api/history?limit=30"))
  }, [])

  const prefetchAll = useCallback(() => {
    prefetchDashboard()
    prefetchProducts()
    prefetchHistory()
  }, [prefetchDashboard, prefetchProducts, prefetchHistory])

  const scheduleIdle = useCallback((fn: () => void) => {
    if ("requestIdleCallback" in window) {
      raf.current = (window as any).requestIdleCallback(fn, { timeout: 2000 })
    } else {
      raf.current = window.setTimeout(fn, 0)
    }
  }, [])

  return { prefetchDashboard, prefetchProducts, prefetchHistory, prefetchAll, scheduleIdle }
}

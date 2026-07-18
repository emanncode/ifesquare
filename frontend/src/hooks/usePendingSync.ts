import { useCallback, useEffect, useState } from "react"
import { getPendingCount, replayQueue } from "@/lib/offlineQueue"

export function usePendingSync() {
  const [count, setCount] = useState(0)

  const refresh = useCallback(async () => {
    setCount(await getPendingCount())
  }, [])

  useEffect(() => {
    refresh()
    const handler = () => { void refresh() }
    window.addEventListener("pending-sync-change", handler)
    window.addEventListener("online", () => { void replayQueue(); void refresh() })
    return () => {
      window.removeEventListener("pending-sync-change", handler)
      window.removeEventListener("online", () => { void replayQueue(); void refresh() })
    }
  }, [refresh])

  return count
}

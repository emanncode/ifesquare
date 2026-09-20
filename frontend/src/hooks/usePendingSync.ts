import { useCallback, useEffect, useState } from "react"
import { getPendingCount, replayQueue } from "@/lib/offlineQueue"

export function usePendingSync() {
  const [count, setCount] = useState(0)

  const refresh = useCallback(async () => {
    setCount(await getPendingCount())
  }, [])

  useEffect(() => {
    void refresh()
    const handler = () => { void refresh() }
    const onlineHandler = () => {
      void replayQueue()
      void refresh()
    }
    window.addEventListener("pending-sync-change", handler)
    window.addEventListener("online", onlineHandler)
    return () => {
      window.removeEventListener("pending-sync-change", handler)
      window.removeEventListener("online", onlineHandler)
    }
  }, [refresh])

  return count
}

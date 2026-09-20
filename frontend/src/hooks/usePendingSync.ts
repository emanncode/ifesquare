import { useEffect, useState } from "react"
import { getPendingCount, replayQueue } from "@/lib/offlineQueue"

export function usePendingSync() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    let isMounted = true

    const updateCount = () => {
      void getPendingCount().then((cnt) => {
        if (isMounted) setCount(cnt)
      })
    }

    // Initial check
    updateCount()

    const handler = () => {
      updateCount()
    }
    const onlineHandler = () => {
      void replayQueue().then(() => {
        updateCount()
      })
    }

    window.addEventListener("pending-sync-change", handler)
    window.addEventListener("online", onlineHandler)
    return () => {
      isMounted = false
      window.removeEventListener("pending-sync-change", handler)
      window.removeEventListener("online", onlineHandler)
    }
  }, [])

  return count
}

import { useEffect } from "react"
import { BrowserRouter } from "react-router-dom"
import { AuthProvider } from "@/components/AuthProvider"
import { AppRoutes } from "@/components/AppRoutes"
import { ErrorBoundary } from "@/components/ErrorBoundary"
import { ToastProvider } from "@/hooks/useToast"
import { replayQueue } from "@/lib/offlineQueue"

function OfflineReplay() {
  useEffect(() => {
    replayQueue()
    window.addEventListener("online", replayQueue)
    return () => window.removeEventListener("online", replayQueue)
  }, [])
  return null
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <ToastProvider>
          <AuthProvider>
            <OfflineReplay />
            <AppRoutes />
          </AuthProvider>
        </ToastProvider>
      </BrowserRouter>
    </ErrorBoundary>
  )
}

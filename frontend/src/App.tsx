import { useEffect } from "react"
import { BrowserRouter, Route, Routes } from "react-router-dom"
import { AuthProvider } from "@/components/AuthProvider"
import { AppRoutes } from "@/components/AppRoutes"
import { ErrorBoundary } from "@/components/ErrorBoundary"
import { ToastProvider } from "@/hooks/useToast"
import { replayQueue } from "@/lib/offlineQueue"
import LandingPage from "@/pages/ComingSoonPage"

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
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route
              path="/*"
              element={
                <AuthProvider>
                  <OfflineReplay />
                  <AppRoutes />
                </AuthProvider>
              }
            />
          </Routes>
        </ToastProvider>
      </BrowserRouter>
    </ErrorBoundary>
  )
}

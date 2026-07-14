import { BrowserRouter, Navigate, Route, Routes, useNavigate } from "react-router-dom"
import { Loader2 } from "lucide-react"
import ComingSoonPage from "@/pages/ComingSoonPage"
import LoginPage from "@/pages/LoginPage"
import DashboardPage from "@/pages/DashboardPage"
import HistoryPage from "@/pages/HistoryPage"
import { useAuth } from "@/hooks/useAuth"

/**
 * While the product is under construction, `/` is the public coming-soon page.
 * App routes exist under `/app/*` so we can build them in parallel without
 * exposing an unfinished dashboard. Flip the landing route when ready to launch.
 */
export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}

function AppRoutes() {
  const { loading, login, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background">
        <Loader2
          className="size-6 animate-spin text-muted-foreground"
          aria-label="Loading session"
        />
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/" element={<ComingSoonPage />} />
      <Route
        path="/login"
        element={
          isAuthenticated ? (
            <Navigate to="/app" replace />
          ) : (
            <LoginPage
              onSubmit={async (email, password) => {
                await login(email, password)
                navigate("/app", { replace: true })
              }}
            />
          )
        }
      />
      <Route
        path="/app"
        element={
          isAuthenticated ? (
            <DashboardPage />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/app/history"
        element={
          isAuthenticated ? (
            <HistoryPage />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route path="/history" element={<Navigate to="/app/history" replace />} />
      <Route path="/products" element={<Navigate to="/app" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

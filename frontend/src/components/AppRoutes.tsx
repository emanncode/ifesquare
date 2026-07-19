import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom"
import { AnimatePresence } from "framer-motion"
import { Loader2 } from "lucide-react"
import ComingSoonPage from "@/pages/ComingSoonPage"
import LoginPage from "@/pages/LoginPage"
import DashboardPage from "@/pages/DashboardPage"
import HistoryPage from "@/pages/HistoryPage"
import ProductsPage from "@/pages/ProductsPage"
import SettingsPage from "@/pages/SettingsPage"
import { AppLayout } from "@/components/layout/AppLayout"
import { useAuth } from "@/hooks/useAuth"

function StaffRouteGuard({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  if (user?.role === "staff") {
    return <Navigate to="/app" replace />
  }
  return <>{children}</>
}

export function AppRoutes() {
  const { loading, login, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

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
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
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

        <Route path="/app" element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route
            path="products"
            element={
              <StaffRouteGuard>
                <ProductsPage />
              </StaffRouteGuard>
            }
          />
          <Route
            path="history"
            element={
              <StaffRouteGuard>
                <HistoryPage />
              </StaffRouteGuard>
            }
          />
          <Route
            path="settings"
            element={
              <StaffRouteGuard>
                <SettingsPage />
              </StaffRouteGuard>
            }
          />
        </Route>

        <Route path="/history" element={<Navigate to="/app/history" replace />} />
        <Route
          path="/products"
          element={<Navigate to="/app/products" replace />}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  )
}

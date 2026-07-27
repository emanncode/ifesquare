import { lazy, Suspense } from "react"
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom"
import { AnimatePresence } from "framer-motion"
import { Loader2 } from "lucide-react"
import { AppLayout } from "@/components/layout/AppLayout"
import { useAuth } from "@/hooks/useAuth"

const ComingSoonPage = lazy(() => import("@/pages/ComingSoonPage"))
const LoginPage = lazy(() => import("@/pages/LoginPage"))
const DashboardPage = lazy(() => import("@/pages/DashboardPage"))
const HistoryPage = lazy(() => import("@/pages/HistoryPage"))
const ProductsPage = lazy(() => import("@/pages/ProductsPage"))
const SettingsPage = lazy(() => import("@/pages/SettingsPage"))

function PageLoader() {
  return (
    <div className="flex min-h-[50svh] items-center justify-center">
      <Loader2 className="size-6 animate-spin text-muted-foreground" />
    </div>
  )
}

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
        <Route path="/" element={<Suspense fallback={<PageLoader />}><ComingSoonPage /></Suspense>} />
        <Route
          path="/login"
          element={
            isAuthenticated ? (
              <Navigate to="/app" replace />
            ) : (
              <Suspense fallback={<PageLoader />}>
                <LoginPage
                  onSubmit={async (email, password) => {
                    await login(email, password)
                    navigate("/app", { replace: true })
                  }}
                />
              </Suspense>
            )
          }
        />

        <Route path="/app" element={<AppLayout />}>
          <Route index element={<Suspense fallback={<PageLoader />}><DashboardPage /></Suspense>} />
          <Route
            path="products"
            element={
              <StaffRouteGuard>
                <Suspense fallback={<PageLoader />}><ProductsPage /></Suspense>
              </StaffRouteGuard>
            }
          />
          <Route
            path="history"
            element={
              <StaffRouteGuard>
                <Suspense fallback={<PageLoader />}><HistoryPage /></Suspense>
              </StaffRouteGuard>
            }
          />
          <Route
            path="settings"
            element={
              <StaffRouteGuard>
                <Suspense fallback={<PageLoader />}><SettingsPage /></Suspense>
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

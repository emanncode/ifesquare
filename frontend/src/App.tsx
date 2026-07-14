import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useNavigate,
} from "react-router-dom"
import { Loader2 } from "lucide-react"
import ComingSoonPage from "@/pages/ComingSoonPage"
import LoginPage from "@/pages/LoginPage"
import DashboardPage from "@/pages/DashboardPage"
import HistoryPage from "@/pages/HistoryPage"
import ProductsPage from "@/pages/ProductsPage"
import { AppLayout } from "@/components/layout/AppLayout"
import { AuthProvider, useAuth } from "@/hooks/useAuth"

/**
 * While the product is under construction, `/` is the public coming-soon page.
 * Authenticated app routes share a fixed sidebar shell under `/app/*`.
 */
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
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

      {/* Shared fixed sidebar; only <main> / Outlet content scrolls */}
      <Route path="/app" element={<AppLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="history" element={<HistoryPage />} />
      </Route>

      <Route path="/history" element={<Navigate to="/app/history" replace />} />
      <Route
        path="/products"
        element={<Navigate to="/app/products" replace />}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

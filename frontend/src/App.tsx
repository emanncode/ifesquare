import { BrowserRouter } from "react-router-dom"
import { AuthProvider } from "@/components/AuthProvider"
import { AppRoutes } from "@/components/AppRoutes"
import { ErrorBoundary } from "@/components/ErrorBoundary"

/**
 * While the product is under construction, `/` is the public coming-soon page.
 * Authenticated app routes share a fixed sidebar shell under `/app/*`.
 */
export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  )
}

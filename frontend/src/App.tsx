import { BrowserRouter } from "react-router-dom"
import { AuthProvider } from "@/hooks/useAuth"
import { AppRoutes } from "@/components/AppRoutes"

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

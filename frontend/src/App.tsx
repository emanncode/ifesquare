import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import ComingSoonPage from "@/pages/ComingSoonPage"
import LoginPage from "@/pages/LoginPage"
import DashboardPage from "@/pages/DashboardPage"
import HistoryPage from "@/pages/HistoryPage"

/**
 * While the product is under construction, `/` is the public coming-soon page.
 * App routes exist under `/app/*` so we can build them in parallel without
 * exposing an unfinished dashboard. Flip the landing route when ready to launch.
 */
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ComingSoonPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/app" element={<DashboardPage />} />
        <Route path="/app/history" element={<HistoryPage />} />
        <Route path="/history" element={<Navigate to="/app/history" replace />} />
        <Route path="/products" element={<Navigate to="/app" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

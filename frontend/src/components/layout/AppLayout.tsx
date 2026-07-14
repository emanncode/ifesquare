import { useCallback, useMemo, useState } from "react"
import { Navigate, Outlet } from "react-router-dom"
import { Sidebar } from "@/components/dashboard/Sidebar"
import { ProductsProvider } from "@/components/dashboard/ProductsProvider"
import { useAuth } from "@/hooks/useAuth"
import { AppShellContext } from "@/components/layout/appShell"

/**
 * Authenticated shell: fixed sidebar + independently scrolling main.
 * Sidebar stays put while /app/* pages scroll inside <main>.
 */
export function AppLayout() {
  const { isAuthenticated } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)

  const openMobileNav = useCallback(() => setMobileOpen(true), [])
  const closeMobileNav = useCallback(() => setMobileOpen(false), [])

  const shellValue = useMemo(
    () => ({ openMobileNav }),
    [openMobileNav],
  )

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return (
    <AppShellContext.Provider value={shellValue}>
      <ProductsProvider>
        <div className="flex h-svh overflow-hidden bg-background dark:bg-background">
          <Sidebar open={mobileOpen} onClose={closeMobileNav} />

          {/* Only this region scrolls; sidebar is position:fixed */}
          <main className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-y-contain bg-muted/30 dark:bg-muted/15 lg:pl-64">
            <Outlet />
          </main>
        </div>
      </ProductsProvider>
    </AppShellContext.Provider>
  )
}

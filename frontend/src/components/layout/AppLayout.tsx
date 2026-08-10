import { useCallback, useEffect, useMemo, useState } from "react"
import { Navigate, Outlet } from "react-router-dom"
import { WifiOff } from "lucide-react"
import { Sidebar } from "@/components/dashboard/Sidebar"
import { ProductsProvider } from "@/components/dashboard/ProductsProvider"
import { useAuth } from "@/hooks/useAuth"
import { useOnline } from "@/hooks/useOnline"
import { usePrefetch } from "@/hooks/usePrefetch"
import { AppShellContext } from "@/components/layout/appShell"

/**
 * Authenticated shell: fixed sidebar + independently scrolling main.
 * Sidebar stays put while /app/* pages scroll inside <main>.
 */
export function AppLayout() {
  const { isAuthenticated } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const online = useOnline()

  const openMobileNav = useCallback(() => setMobileOpen(true), [])
  const closeMobileNav = useCallback(() => setMobileOpen(false), [])

  const shellValue = useMemo(
    () => ({ openMobileNav }),
    [openMobileNav],
  )

  const { prefetchAll, scheduleIdle } = usePrefetch()
  useEffect(() => {
    scheduleIdle(prefetchAll)
  }, [prefetchAll, scheduleIdle])

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return (
    <AppShellContext.Provider value={shellValue}>
      <ProductsProvider>
        <div className="flex h-svh overflow-hidden bg-background dark:bg-background">
          <Sidebar open={mobileOpen} onClose={closeMobileNav} />

          <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
            {!online && (
              <div className="flex shrink-0 items-center gap-2 border-b border-amber-500/20 bg-amber-500/10 px-4 py-2 text-xs font-medium text-amber-700 dark:text-amber-400">
                <WifiOff className="size-3.5 shrink-0" />
                You&apos;re offline — changes are saved and will sync when you&apos;re back online.
              </div>
            )}
            {/* Only this region scrolls; sidebar is position:fixed */}
            <main className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-y-contain bg-muted/30 dark:bg-muted/15">
              <Outlet />
            </main>
          </div>
        </div>
      </ProductsProvider>
    </AppShellContext.Provider>
  )
}

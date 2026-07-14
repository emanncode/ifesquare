import { createContext, useContext } from "react"

export type AppShellContextValue = {
  openMobileNav: () => void
}

export const AppShellContext = createContext<AppShellContextValue | null>(null)

/** Open the mobile sidebar drawer from page headers. */
export function useAppShell() {
  const ctx = useContext(AppShellContext)
  if (!ctx) {
    throw new Error("useAppShell must be used within AppLayout")
  }
  return ctx
}

import { createContext, useContext } from "react"
import type { User } from "@/lib/types"

export type AuthContextValue = {
  user: User | null
  loading: boolean
  error: string | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<User>
  logout: () => Promise<void>
  refresh: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return ctx
}

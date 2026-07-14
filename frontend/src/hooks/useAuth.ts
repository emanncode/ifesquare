import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { api, ApiError } from "@/lib/api"
import { getLoginErrorMessage } from "@/lib/loginErrors"
import type { User } from "@/lib/types"

type AuthState = {
  user: User | null
  loading: boolean
  error: string | null
}

type AuthContextValue = {
  user: User | null
  loading: boolean
  error: string | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<User>
  logout: () => Promise<void>
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

/**
 * Shared session for the whole app (sidebar, routes, pages).
 * Cookie-based JWT against the Go /api/auth/* endpoints.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  })

  // Load session once on mount (async — setState only after the fetch settles).
  useEffect(() => {
    let cancelled = false

    void (async () => {
      try {
        const user = await api<User>("/api/auth/me")
        if (!cancelled) {
          setState({ user, loading: false, error: null })
        }
      } catch (err) {
        if (cancelled) return
        if (err instanceof ApiError && err.status === 401) {
          setState({ user: null, loading: false, error: null })
          return
        }
        setState({
          user: null,
          loading: false,
          error: err instanceof Error ? err.message : "Failed to load session",
        })
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  const refresh = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }))
    try {
      const user = await api<User>("/api/auth/me")
      setState({ user, loading: false, error: null })
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setState({ user: null, loading: false, error: null })
        return
      }
      setState({
        user: null,
        loading: false,
        error: err instanceof Error ? err.message : "Failed to load session",
      })
    }
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    setState((s) => ({ ...s, loading: true, error: null }))
    try {
      const user = await api<User>("/api/auth/login", {
        method: "POST",
        body: { email, password },
      })
      setState({ user, loading: false, error: null })
      return user
    } catch (err) {
      const message = getLoginErrorMessage(err)
      setState((s) => ({ ...s, loading: false, error: message }))
      throw new Error(message, { cause: err })
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await api("/api/auth/logout", { method: "POST" })
    } finally {
      setState({ user: null, loading: false, error: null })
    }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user: state.user,
      loading: state.loading,
      error: state.error,
      isAuthenticated: state.user !== null,
      login,
      logout,
      refresh,
    }),
    [state.user, state.loading, state.error, login, logout, refresh],
  )

  return createElement(AuthContext.Provider, { value }, children)
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return ctx
}

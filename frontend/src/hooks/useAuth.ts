import { useCallback, useEffect, useState } from "react"
import { api, ApiError } from "@/lib/api"
import { getLoginErrorMessage } from "@/lib/loginErrors"
import type { User } from "@/lib/types"

type AuthState = {
  user: User | null
  loading: boolean
  error: string | null
}

/**
 * Session helper: checks /api/auth/me on mount and exposes login/logout.
 * Cookie-based JWT session against the Go /api/auth/* endpoints.
 */
export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  })

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

  useEffect(() => {
    void refresh()
  }, [refresh])

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
      // Re-throw with a friendly message so LoginPage can display it.
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

  return {
    user: state.user,
    loading: state.loading,
    error: state.error,
    isAuthenticated: state.user !== null,
    login,
    logout,
    refresh,
  }
}

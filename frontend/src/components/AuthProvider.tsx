import {
  createElement,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { api, ApiError } from "@/lib/api"
import { getLoginErrorMessage } from "@/lib/loginErrors"
import { AuthContext } from "@/hooks/useAuth"
import type { User } from "@/lib/types"

const SESSION_KEY = "auth_login_time"
const SESSION_DURATION_MS = 24 * 60 * 60 * 1000

type AuthState = {
  user: User | null
  loading: boolean
  error: string | null
}

function getStoredLoginTime(): number | null {
  try {
    const val = localStorage.getItem(SESSION_KEY)
    return val ? Number(val) : null
  } catch {
    return null
  }
}

function setStoredLoginTime() {
  try {
    localStorage.setItem(SESSION_KEY, String(Date.now()))
  } catch {}
}

function clearStoredLoginTime() {
  try {
    localStorage.removeItem(SESSION_KEY)
  } catch {}
}

function isSessionExpired(): boolean {
  const loginTime = getStoredLoginTime()
  if (!loginTime) return false
  return Date.now() - loginTime >= SESSION_DURATION_MS
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  })

  useEffect(() => {
    let cancelled = false

    void (async () => {
      try {
        const user = await api<User>("/api/auth/me")
        if (!cancelled) {
          if (isSessionExpired()) {
            await api("/api/auth/logout", { method: "POST" })
            clearStoredLoginTime()
            setState({ user: null, loading: false, error: null })
            return
          }
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
    try {
      const user = await api<User>("/api/auth/login", {
        method: "POST",
        body: { email, password },
      })
      setStoredLoginTime()
      setState({ user, loading: false, error: null })
      return user
    } catch (err) {
      const message = getLoginErrorMessage(err)
      setState((s) => ({ ...s, error: message }))
      throw new Error(message, { cause: err })
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await api("/api/auth/logout", { method: "POST" })
    } finally {
      clearStoredLoginTime()
      setState({ user: null, loading: false, error: null })
    }
  }, [])

  const value = useMemo(
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
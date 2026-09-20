import { Component, type ErrorInfo, type ReactNode } from "react"
import { AlertTriangle, RefreshCw } from "lucide-react"
import {
  isJsonParseError,
  isNetworkError,
  JSON_PARSE_ERROR_MSG,
  NETWORK_ERROR_MSG,
} from "@/lib/api"

type Props = {
  children: ReactNode
  fallback?: ReactNode
}

type State = {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (typeof window !== "undefined" && "SENTRY_DSN" in window) {
      try {
        const win = window as unknown as {
          Sentry?: { captureException?: (err: unknown, ctx?: unknown) => void }
        }
        const Sentry = win.Sentry
        if (Sentry?.captureException) {
          Sentry.captureException(error, { extra: { componentStack: info.componentStack } })
        }
      } catch {
        // silent
      }
    }
  }

  private formatErrorMessage(): string {
    const err = this.state.error
    if (!err) return "An unexpected error occurred."
    if (isNetworkError(err)) return NETWORK_ERROR_MSG
    if (isJsonParseError(err)) return JSON_PARSE_ERROR_MSG
    return err.message || "An unexpected error occurred."
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback
      return (
        <div className="flex min-h-svh flex-col items-center justify-center gap-4 bg-background px-4 text-center">
          <AlertTriangle className="size-10 text-destructive" />
          <h1 className="text-xl font-bold text-foreground">Something went wrong</h1>
          <p className="max-w-md text-sm text-muted-foreground">
            {this.formatErrorMessage()}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <RefreshCw className="size-4" />
            Reload page
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

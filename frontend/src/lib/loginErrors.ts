import { ApiError } from "@/lib/api"

/** Stable error codes from POST /api/auth/login. */
export const LoginErrorCode = {
  InvalidBody: "invalid body",
  InvalidCredentials: "invalid credentials",
} as const

export type LoginErrorCode =
  (typeof LoginErrorCode)[keyof typeof LoginErrorCode]

/**
 * Map a login failure to a clear, user-facing message.
 * All credential errors return the same generic message to prevent enumeration.
 */
export function getLoginErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    switch (err.message) {
      case LoginErrorCode.InvalidBody:
        return "Something went wrong with your request. Please try again."
      case LoginErrorCode.InvalidCredentials:
        return "Email or password is incorrect."
      default:
        if (err.status === 401) {
          return "Email or password is incorrect."
        }
        if (err.status >= 500) {
          return "Server error — please try again in a moment."
        }
        return err.message || "Couldn't sign in. Please try again."
    }
  }

  if (err instanceof TypeError) {
    // fetch failed (offline / backend down)
    return "Can't reach the server. Check your connection and try again."
  }

  if (err instanceof Error && err.message) {
    return err.message
  }

  return "Couldn't sign in — check your email and password."
}

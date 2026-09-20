import {
  ApiError,
  isJsonParseError,
  isNetworkError,
  JSON_PARSE_ERROR_MSG,
  NETWORK_ERROR_MSG,
} from "@/lib/api"

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
  if (isNetworkError(err)) {
    return NETWORK_ERROR_MSG
  }

  if (isJsonParseError(err)) {
    return JSON_PARSE_ERROR_MSG
  }

  if (err instanceof ApiError) {
    const lower = err.message.toLowerCase()
    if (
      err.status === 401 ||
      lower === LoginErrorCode.InvalidCredentials ||
      lower === "unauthorized" ||
      lower.includes("wrong password") ||
      lower.includes("email or password is incorrect")
    ) {
      return "Email or password is incorrect."
    }
    if (lower === LoginErrorCode.InvalidBody || lower.includes("request format is invalid")) {
      return "Unable to process your sign-in details. Please check and try again."
    }
    if (err.status === 429 || lower.includes("too many attempts")) {
      return "Too many sign-in attempts. Please wait a few moments before trying again."
    }
    if (err.status >= 500) {
      return "The server encountered an error. Please try again in a few moments or reload the page."
    }
    return err.message || "Unable to sign in. Please check your credentials and try again."
  }

  if (err instanceof Error && err.message) {
    return err.message
  }

  return "Unable to sign in. Please check your email and password and try again."
}

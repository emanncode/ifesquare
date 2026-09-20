/**
 * Thin fetch wrapper for the Go REST API.
 * Always sends credentials so the httpOnly JWT cookie is included.
 */

import { queueMutation } from "./offlineQueue";

const API_BASE = import.meta.env.VITE_API_URL ?? ""

export const NETWORK_ERROR_MSG =
  "Bad network connection. Please check your internet connection and reload the page."
export const JSON_PARSE_ERROR_MSG =
  "Unable to process server response. Please reload the page and try again."
export const UNAUTHORIZED_ERROR_MSG =
  "Your session has expired or you are not signed in. Please log in again."
export const FORBIDDEN_ERROR_MSG =
  "You do not have permission to perform this action."
export const SERVER_ERROR_MSG =
  "The server encountered an error. Please try again in a few moments or reload the page."

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = "ApiError"
    this.status = status
  }
}

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown
}

export function isNetworkError(err: unknown): boolean {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return true
  }
  if (err instanceof TypeError) {
    return true
  }
  if (
    err instanceof DOMException &&
    (err.name === "AbortError" || err.name === "TimeoutError")
  ) {
    return true
  }
  if (err instanceof Error) {
    const msg = err.message.toLowerCase()
    return (
      msg.includes("network") ||
      msg.includes("failed to fetch") ||
      msg.includes("load failed") ||
      msg.includes("offline") ||
      msg.includes("connection refused") ||
      msg.includes("networkerror")
    )
  }
  return false
}

export function isJsonParseError(err: unknown): boolean {
  if (err instanceof SyntaxError) {
    return true
  }
  if (err instanceof Error) {
    const msg = err.message.toLowerCase()
    return (
      msg.includes("json") ||
      msg.includes("unexpected token") ||
      msg.includes("is not valid json") ||
      msg.includes("unexpected end of json")
    )
  }
  return false
}

export function toHumanErrorMessage(
  raw?: string,
  status?: number,
  statusText?: string,
): string {
  const text = (raw || statusText || "").trim()
  const lower = text.toLowerCase()

  // 1. Session / Auth
  if (
    status === 401 ||
    lower === "unauthorized" ||
    lower.includes("token expired") ||
    lower.includes("not logged in") ||
    lower.includes("session expired")
  ) {
    return UNAUTHORIZED_ERROR_MSG
  }

  // 2. Permissions
  if (
    status === 403 ||
    lower === "forbidden" ||
    lower.includes("not allowed") ||
    lower.includes("permission denied")
  ) {
    return FORBIDDEN_ERROR_MSG
  }

  // 3. Not Found
  if (
    status === 404 ||
    lower === "not found" ||
    lower === "user not found" ||
    lower === "entry not found"
  ) {
    return "The requested record could not be found."
  }

  // 4. Server issues (500, 502, 503, 504)
  if (
    (status !== undefined && status >= 500) ||
    lower === "internal server error" ||
    lower.includes("bad gateway") ||
    lower.includes("gateway timeout") ||
    lower.includes("service unavailable")
  ) {
    return SERVER_ERROR_MSG
  }

  // 5. Common validation & technical translations
  if (
    lower === "invalid body" ||
    lower === "invalid json" ||
    lower === "cannot read body"
  ) {
    return "The request format is invalid. Please check your information and try again."
  }
  if (lower === "invalid id" || lower === "invalid product id") {
    return "Invalid item selected. The requested item could not be found."
  }
  if (lower === "no ids provided") {
    return "No items were selected. Please select at least one item."
  }
  if (lower === "closing cannot exceed total (opening + receipts)") {
    return "Closing stock cannot exceed total stock (opening + receipts)."
  }
  if (lower === "closing cannot be negative") {
    return "Closing stock cannot be a negative number."
  }
  if (lower === "opening cannot be negative") {
    return "Opening stock cannot be a negative number."
  }
  if (lower === "receipts cannot be negative") {
    return "Receipts cannot be a negative number."
  }
  if (lower === "price cannot be negative") {
    return "Price cannot be a negative number."
  }
  if (lower === "low_stock_threshold cannot be negative") {
    return "Low stock alert threshold cannot be a negative number."
  }
  if (lower === "name is required" || lower === "name cannot be empty") {
    return "Product name is required."
  }
  if (lower === "email and password are required") {
    return "Please enter both your email address and password."
  }
  if (lower === "password too short (min 6 characters)") {
    return "Password must be at least 6 characters long."
  }
  if (lower === "email already in use") {
    return "An account with this email address already exists."
  }
  if (lower === "wrong password") {
    return "The current password you entered is incorrect."
  }
  if (lower === "invalid credentials") {
    return "Email or password is incorrect."
  }
  if (lower === "too many attempts") {
    return "Too many sign-in attempts. Please wait a few moments before trying again."
  }
  if (lower === "no recipients provided") {
    return "Please provide at least one recipient email address."
  }
  if (lower === "streaming not supported") {
    return "Real-time progress streaming is not supported by your connection."
  }
  if (
    lower.startsWith("failed to query") ||
    lower.startsWith("failed to scan") ||
    lower.startsWith("failed to iterate")
  ) {
    return "Unable to load records from the server. Please try again."
  }

  // If text already looks like a natural message, format cleanly
  if (
    text.length > 0 &&
    !lower.includes("sql") &&
    !lower.includes("pq:") &&
    !lower.includes("sqlite")
  ) {
    return text.charAt(0).toUpperCase() + text.slice(1)
  }

  return "An unexpected error occurred. Please reload the page or try again."
}

export async function api<T>(
  path: string,
  { body, headers, ...init }: RequestOptions = {}
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    headers: {
      Accept: "application/json",
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    ...init,
  })

  if (!res.ok) {
    let serverMsg = ""
    try {
      const data = (await res.json()) as { error?: string; message?: string }
      serverMsg = data.error ?? data.message ?? ""
    } catch {
      // ignore JSON parse errors on non-ok responses
    }
    const message = toHumanErrorMessage(serverMsg, res.status, res.statusText)
    throw new ApiError(res.status, message)
  }

  if (res.status === 204) {
    return undefined as T
  }

  try {
    return (await res.json()) as T
  } catch (err) {
    throw new Error(JSON_PARSE_ERROR_MSG, { cause: err })
  }
}

export function errorMessage(err: unknown, fallback: string): string {
  if (isNetworkError(err)) return NETWORK_ERROR_MSG
  if (isJsonParseError(err)) return JSON_PARSE_ERROR_MSG
  if (err instanceof ApiError) {
    return toHumanErrorMessage(err.message || fallback, err.status)
  }
  if (err instanceof Error) {
    return toHumanErrorMessage(err.message || fallback)
  }
  return fallback
}

/**
 * Like api(), but on network error (fetch throws) the mutation is queued for
 * offline replay instead of throwing. Server errors (4xx/5xx) still throw.
 */
export async function mutateWithOffline<T>(
  path: string,
  method: string,
  body: unknown,
): Promise<T | null> {
  try {
    return await api<T>(path, { method, body });
  } catch (err) {
    if (err instanceof ApiError) throw err;
    await queueMutation(path, method, body);
    return null;
  }
}

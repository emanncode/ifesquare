/**
 * Thin fetch wrapper for the Go REST API.
 * Always sends credentials so the httpOnly JWT cookie is included.
 */

import { queueMutation } from "./offlineQueue";

const API_BASE = import.meta.env.VITE_API_URL ?? ""

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
    let message = res.statusText
    try {
      const data = (await res.json()) as { error?: string; message?: string }
      message = data.error ?? data.message ?? message
    } catch {
      // ignore JSON parse errors
    }
    throw new ApiError(res.status, message)
  }

  if (res.status === 204) {
    return undefined as T
  }

  return (await res.json()) as T
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

import { createContext, useContext } from "react"
export { ToastProvider } from "@/components/ToastProvider"

export type ToastType = "error" | "success" | "info"

export type ToastContextValue = {
  toast: (message: string, type?: ToastType) => void
}

export const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error("useToast must be used within ToastProvider")
  return ctx
}

import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { AnimatePresence, motion } from "framer-motion"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

type ToastType = "error" | "success" | "info"

type Toast = {
  id: string
  message: string
  type: ToastType
}

type ToastContextValue = {
  toast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error("useToast must be used within ToastProvider")
  return ctx
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const toast = useCallback(
    (message: string, type: ToastType = "error") => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
      setToasts((prev) => [...prev, { id, message, type }])
      setTimeout(() => remove(id), 5000)
    },
    [remove],
  )

  const value = useMemo(() => ({ toast }), [toast])

  return createElement(
    ToastContext.Provider,
    { value },
    children,
    createElement(Toasts, { toasts, onDismiss: remove }),
  )
}

function Toasts({
  toasts,
  onDismiss,
}: {
  toasts: Toast[]
  onDismiss: (id: string) => void
}) {
  return createElement(
    "div",
    {
      "aria-live": "polite",
      "aria-label": "Notifications",
      className:
        "pointer-events-none fixed inset-0 z-[100] flex flex-col items-end gap-2 p-4 sm:p-6",
    },
    createElement(
      AnimatePresence as React.ComponentType<{ mode?: "popLayout" | "wait" | "sync" }>,
      { mode: "popLayout" },
      toasts.map((t) =>
        createElement(
          motion.div,
          {
            key: t.id,
            layout: true,
            initial: { opacity: 0, x: 80, scale: 0.95 },
            animate: { opacity: 1, x: 0, scale: 1 },
            exit: { opacity: 0, x: 80, scale: 0.95, transition: { duration: 0.15 } },
            transition: { type: "spring", stiffness: 400, damping: 30 },
            role: "alert",
            className: cn(
              "pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border px-4 py-3 shadow-lg backdrop-blur-sm",
              t.type === "error" &&
                "border-destructive/30 bg-destructive/10 text-destructive",
              t.type === "success" &&
                "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
              t.type === "info" &&
                "border-primary/30 bg-primary/10 text-primary",
            ),
          },
          createElement(
            "p",
            { className: "flex-1 text-sm leading-snug" },
            t.message,
          ),
          createElement(
            "button",
            {
              type: "button",
              onClick: () => onDismiss(t.id),
              className:
                "mt-0.5 shrink-0 rounded-md p-0.5 opacity-60 transition-opacity hover:opacity-100",
              "aria-label": "Dismiss",
            },
            createElement(X, { className: "size-4" }),
          ),
        ),
      ),
    ),
  )
}

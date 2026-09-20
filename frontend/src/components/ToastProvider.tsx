import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { AnimatePresence, motion } from "framer-motion"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import { ToastContext, type ToastType } from "@/hooks/useToast"

type Toast = {
  id: string
  message: string
  type: ToastType
}

const activeTimers = new Map<string, ReturnType<typeof setTimeout>>()

function scheduleTimer(id: string, callback: () => void) {
  clearTimer(id)
  activeTimers.set(id, setTimeout(callback, 5000))
}

function clearTimer(id: string) {
  const t = activeTimers.get(id)
  if (t) {
    clearTimeout(t)
    activeTimers.delete(id)
  }
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const remove = useCallback((id: string) => {
    clearTimer(id)
    setToasts((prev) => prev.filter((x) => x.id !== id))
  }, [])

  const pause = useCallback((id: string) => {
    clearTimer(id)
  }, [])

  const resume = useCallback(
    (id: string) => {
      scheduleTimer(id, () => remove(id))
    },
    [remove],
  )

  const toast = useCallback(
    (message: string, type: ToastType = "error") => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
      setToasts((prev) => [...prev, { id, message, type }])
      scheduleTimer(id, () => remove(id))
    },
    [remove],
  )

  useEffect(() => {
    return () => {
      activeTimers.forEach((t) => clearTimeout(t))
      activeTimers.clear()
    }
  }, [])

  const value = useMemo(() => ({ toast }), [toast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Toasts toasts={toasts} onDismiss={remove} onPause={pause} onResume={resume} />
    </ToastContext.Provider>
  )
}

function Toasts({
  toasts,
  onDismiss,
  onPause,
  onResume,
}: {
  toasts: Toast[]
  onDismiss: (id: string) => void
  onPause: (id: string) => void
  onResume: (id: string) => void
}) {
  return (
    <div
      aria-live="polite"
      aria-label="Notifications"
      className="pointer-events-none fixed inset-0 z-[100] flex flex-col items-end gap-2 p-4 sm:p-6"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, x: 80, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 80, scale: 0.95, transition: { duration: 0.15 } }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            role="alert"
            onMouseEnter={() => onPause(t.id)}
            onMouseLeave={() => onResume(t.id)}
            className={cn(
              "pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border px-4 py-3 shadow-lg backdrop-blur-sm",
              t.type === "error" &&
                "border-destructive/30 bg-destructive/10 text-destructive",
              t.type === "success" &&
                "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
              t.type === "info" &&
                "border-primary/30 bg-primary/10 text-primary",
            )}
          >
            <p className="flex-1 text-sm leading-snug">{t.message}</p>
            <button
              type="button"
              onClick={() => onDismiss(t.id)}
              className="mt-0.5 shrink-0 rounded-md p-0.5 opacity-60 transition-opacity hover:opacity-100"
              aria-label="Dismiss"
            >
              <X className="size-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

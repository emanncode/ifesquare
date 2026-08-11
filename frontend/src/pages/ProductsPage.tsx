import { useRef, useState, useMemo, useEffect } from "react"
import { motion } from "framer-motion"
import { Download, Upload, Menu, Loader2, Mail, Send } from "lucide-react"
import { useAppShell } from "@/components/layout/appShell"
import { ProductsCatalog } from "@/components/dashboard/ProductsCatalog"
import { useProducts } from "@/components/dashboard/useProducts"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/useToast"
import { errorMessage, api } from "@/lib/api"
import { useAuth } from "@/hooks/useAuth"

const API_BASE = import.meta.env.VITE_API_URL ?? ""

export type ImportProgress = {
  current: number
  total: number
} | null

export default function ProductsPage() {
  const { openMobileNav } = useAppShell()
  const { toast } = useToast()
  const { refresh } = useProducts()
  const { user } = useAuth()
  const fileRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [importing, setImporting] = useState(false)
  const [progress, setProgress] = useState<ImportProgress>(null)

  const [menuOpen, setMenuOpen] = useState(false)
  const [sending, setSending] = useState(false)

  const recipients = useMemo(() => {
    if (!user) return []
    const list = [{ id: "self", name: "you", email: user.email }]
    if (user.email_2_address) {
      list.push({ id: "email2", name: user.email_2_name || "Recipient 2", email: user.email_2_address })
    }
    if (user.email_3_address) {
      list.push({ id: "email3", name: user.email_3_name || "Recipient 3", email: user.email_3_address })
    }
    return list
  }, [user])

  const [selected, setSelected] = useState<string[]>(["self", "email2", "email3"])

  const visibleSelected = useMemo(
    () => selected.filter((id) => recipients.some((r) => r.id === id)),
    [selected, recipients],
  )

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  async function handleSendSummary() {
    if (visibleSelected.length === 0) return
    setSending(true)
    try {
      const selectedEmails = recipients
        .filter((r) => visibleSelected.includes(r.id))
        .map((r) => r.email)

      await api("/api/ledger/send-summary", {
        method: "POST",
        body: {
          recipients: selectedEmails,
        },
      })
      toast("Summary email sent successfully", "success")
      setMenuOpen(false)
    } catch (err) {
      toast(errorMessage(err, "Failed to send summary"))
    } finally {
      setSending(false)
    }
  }

  function handleDownloadTemplate() {
    const a = document.createElement("a")
    a.href = `${API_BASE}/api/products/template`
    a.download = "ifesquare-products-template.csv"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  async function handleFilePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    setProgress(null)
    try {
      const text = await file.text()
      const res = await fetch(`${API_BASE}/api/products/import`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "text/csv" },
        body: text,
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? res.statusText)
      }
      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ""
      let finalResult: { created: number; errors?: string[] } | null = null

      function processLine(line: string) {
        if (!line.startsWith("data: ")) return
        const json = line.slice(6)
        const evt = JSON.parse(json)
        if (evt.type === "start") {
          setProgress({ current: 0, total: evt.total })
        } else if (evt.type === "progress") {
          setProgress({ current: evt.current, total: evt.total })
        } else if (evt.type === "done") {
          finalResult = { created: evt.created, errors: evt.errors }
        } else if (evt.type === "error") {
          throw new Error(evt.message)
        }
      }

      while (true) {
        const { done, value } = await reader.read()
        if (done) {
          for (const line of buffer.split("\n")) processLine(line)
          break
        }
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split("\n")
        buffer = lines.pop() ?? ""
        for (const line of lines) processLine(line)
      }

      if (finalResult) {
        const { created, errors } = finalResult as { created: number; errors?: string[] }
        if (errors && errors.length > 0) {
          toast(`${created} created, ${errors.length} skipped: ${errors.slice(0, 3).join("; ")}`, "error")
        } else {
          toast(`${created} products imported`, "success")
        }
      }
    } catch (err) {
      toast(errorMessage(err, "Import failed"))
    } finally {
      setImporting(false)
      setProgress(null)
      if (fileRef.current) fileRef.current.value = ""
      await refresh()
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.3 }}
      className="mx-auto p-[5%] px-4 py-6 sm:px-6 sm:py-8 lg:px-8"
    >
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="shrink-0 rounded-xl lg:hidden"
            onClick={openMobileNav}
            aria-label="Open menu"
          >
            <Menu className="size-5" />
          </Button>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Catalog
            </p>
            <h1 className="mt-0.5 text-2xl font-semibold tracking-tight text-foreground">
              Products
            </h1>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {user?.role === "owner" && (
            <div ref={dropdownRef} className="relative">
              <Button
                variant="outline"
                size="lg"
                className="rounded-xl gap-2"
                onClick={() => setMenuOpen((o) => !o)}
              >
                <Mail className="size-4" />
                Send Summary
              </Button>
              {menuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[1px] sm:hidden"
                    onClick={() => setMenuOpen(false)}
                  />
                  <div className="fixed inset-x-4 bottom-4 top-auto z-50 rounded-xl border border-border bg-popover text-popover-foreground shadow-lg p-3 space-y-3 sm:absolute sm:inset-x-auto sm:right-0 sm:left-auto sm:top-full sm:bottom-auto sm:w-72 sm:mt-2">
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-foreground">Select Recipients</p>
                      <p className="text-[10px] text-muted-foreground">Choose who to email the sales summary report.</p>
                    </div>
                    
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      <label className="flex items-center gap-2 text-xs font-semibold pb-1.5 border-b border-border select-none cursor-pointer">
                        <input
                          type="checkbox"
                          checked={visibleSelected.length === recipients.length && recipients.length > 0}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelected(recipients.map((r) => r.id))
                            } else {
                              setSelected([])
                            }
                          }}
                          className="rounded border-border text-primary focus:ring-primary"
                        />
                        <span>Select all</span>
                      </label>

                      {recipients.map((r) => (
                        <label key={r.id} className="flex items-start gap-2 text-xs select-none cursor-pointer hover:text-foreground">
                          <input
                            type="checkbox"
                            checked={visibleSelected.includes(r.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelected((prev) => [...prev, r.id])
                              } else {
                                setSelected((prev) => prev.filter((id) => id !== r.id))
                              }
                            }}
                            className="mt-0.5 rounded border-border text-primary focus:ring-primary"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate capitalize">{r.name}</p>
                            <p className="text-[10px] text-muted-foreground truncate">{r.email}</p>
                          </div>
                        </label>
                      ))}
                    </div>

                    <Button
                      size="sm"
                      className="w-full mt-1 gap-1.5"
                      disabled={sending || selected.length === 0}
                      onClick={() => void handleSendSummary()}
                    >
                      {sending ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
                      Send Email
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
          <Button
            variant="outline"
            size="lg"
            className="rounded-xl"
            onClick={handleDownloadTemplate}
          >
            <Download className="size-4" />
            Template
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="rounded-xl"
            disabled={importing}
            onClick={() => fileRef.current?.click()}
          >
            {importing ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Upload className="size-4" />
            )}
            Import CSV
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleFilePick}
          />
        </div>
      </div>

      <ProductsCatalog importProgress={progress} />
    </motion.div>
  )
}

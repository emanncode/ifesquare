import { useRef, useState } from "react"
import { motion } from "framer-motion"
import { Download, Upload, Menu, Loader2 } from "lucide-react"
import { useAppShell } from "@/components/layout/appShell"
import { ProductsCatalog } from "@/components/dashboard/ProductsCatalog"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/useToast"

const API_BASE = import.meta.env.VITE_API_URL ?? ""

export type ImportProgress = {
  current: number
  total: number
} | null

export default function ProductsPage() {
  const { openMobileNav } = useAppShell()
  const { toast } = useToast()
  const fileRef = useRef<HTMLInputElement>(null)
  const [importing, setImporting] = useState(false)
  const [progress, setProgress] = useState<ImportProgress>(null)

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

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split("\n")
        buffer = lines.pop() ?? ""
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue
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
      }

      if (finalResult) {
        if (finalResult.errors && finalResult.errors.length > 0) {
          toast(`${finalResult.created} created, ${finalResult.errors.length} errors: ${finalResult.errors.slice(0, 3).join("; ")}`, "error")
        } else {
          toast(`${finalResult.created} products imported`, "success")
        }
      }
    } catch (err) {
      toast(err instanceof Error ? err.message : "Import failed")
    } finally {
      setImporting(false)
      setProgress(null)
      if (fileRef.current) fileRef.current.value = ""
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
      <div className="mb-6 flex items-center gap-3">
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
        <div className="flex-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Catalog
          </p>
          <h1 className="mt-0.5 text-2xl font-semibold tracking-tight text-foreground">
            Products
          </h1>
        </div>
        <div className="flex items-center gap-2">
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

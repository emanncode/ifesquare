import { BookOpen, Package, History, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"

export function Sidebar() {
  const items = [
    { label: "Today's ledger", icon: BookOpen, active: true },
    { label: "Products", icon: Package, active: false },
    { label: "History", icon: History, active: false },
  ]

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-border bg-card px-4 py-6">
      <div className="mb-8 flex items-center gap-2.5 px-2">
        <div className="relative flex size-8 items-center justify-center">
          <div
            className="absolute inset-0 rounded-lg"
            style={{
              background:
                "linear-gradient(145deg, oklch(0.6 0.14 150), oklch(0.4 0.1 150))",
            }}
          />
          <div className="relative flex size-6 items-center justify-center rounded-[6px] bg-white/95">
            <span className="text-[10px] font-bold text-primary">IS</span>
          </div>
        </div>
        <span className="text-sm font-semibold tracking-tight text-foreground">
          Ifesquare
        </span>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {items.map((item) => (
          <button
            key={item.label}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
              item.active
                ? "bg-primary/10 font-medium text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <item.icon className="size-4" />
            {item.label}
          </button>
        ))}
      </nav>

      <button className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
        <LogOut className="size-4" />
        Sign out
      </button>
    </aside>
  )
}

import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

export function CatalogTd({
  children,
  align = "left",
  className,
}: {
  children?: ReactNode
  align?: "left" | "right"
  className?: string
}) {
  return (
    <td
      className={cn(
        "h-14 border-r border-border/60 px-4 py-4",
        align === "right" && "text-right",
        className,
      )}
    >
      {children}
    </td>
  )
}

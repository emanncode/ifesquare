import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

export function CatalogTh({
  children,
  align = "center",
  className,
}: {
  children?: ReactNode
  align?: "left" | "right" | "center"
  className?: string
}) {
  return (
    <th
      className={cn(
        "h-14 px-4 py-4 font-medium",
        align === "right" && "text-right",
        align === "left" && "text-left",
        className,
      )}
    >
      {children}
    </th>
  )
}

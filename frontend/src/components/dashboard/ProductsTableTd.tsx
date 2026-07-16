import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

export function ProductsTableTd({
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
        "px-3 py-3.5",
        align === "right" && "text-right",
        className,
      )}
    >
      {children}
    </td>
  )
}

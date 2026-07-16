import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

export function ProductsTableTh({
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
        "px-3 py-3.5 font-semibold",
        align === "right" && "text-right",
        className,
      )}
    >
      {children}
    </th>
  )
}

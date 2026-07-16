import * as React from "react"
import { cn } from "@/lib/utils"

export function Card({
  className,
  size = "default",
  hoverable = true,
  ...props
}: React.ComponentProps<"div"> & {
  size?: "default" | "sm"
  hoverable?: boolean
}) {
  return (
    <div
      data-slot="card"
      data-size={size}
      className={cn(
        "group/card flex flex-col gap-(--card-spacing) overflow-hidden rounded-xl bg-card py-(--card-spacing) text-sm text-card-foreground ring-1 ring-foreground/5 [--card-spacing:--spacining(5)] has-[>img:first-child]:pt-0 data-[size=sm]:[--card-spacing:--spacing(4)] dark:ring-foreground/10 *:[img:first-child]:rounded-t-xl *:[img:last-child]:rounded-b-xl",
        "shadow-[0_1px_2px_oklch(0.2_0.02_150/0.06),0_4px_12px_oklch(0.35_0.06_150/0.08),0_12px_32px_-4px_oklch(0.4_0.08_150/0.14),0_24px_48px_-12px_oklch(0.3_0.06_150/0.12)]",
        "dark:shadow-[0_1px_2px_oklch(0_0_0/0.45),0_8px_24px_oklch(0_0_0/0.35),0_20px_40px_-8px_oklch(0_0_0/0.4)]",
        hoverable && [
          "transition-[transform,box-shadow] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform motion-reduce:transition-none motion-reduce:hover:translate-y-0",
          "hover:-translate-y-1 hover:shadow-[0_2px_4px_oklch(0.2_0.02_150/0.07),0_8px_20px_oklch(0.35_0.08_150/0.12),0_20px_40px_-4px_oklch(0.4_0.1_150/0.18),0_32px_64px_-12px_oklch(0.3_0.08_150/0.16)]",
          "dark:hover:shadow-[0_2px_6px_oklch(0_0_0/0.5),0_12px_28px_oklch(0_0_0/0.42),0_28px_56px_-8px_oklch(0_0_0/0.48)]",
        ],
        className,
      )}
      {...props}
    />
  )
}

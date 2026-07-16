import { cn } from "@/lib/utils"

export function CatalogEditableTextTd({
  value,
  onChange,
  className,
  align = "center",
}: {
  value: string
  onChange: (v: string) => void
  className?: string
  align?: "left" | "right" | "center"
}) {
  return (
    <td
      className={cn(
        "h-14 px-4 py-4",
        align === "right" && "text-right",
        align === "left" && "text-left",
        className,
      )}
    >
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "h-9 w-full min-w-24 border-b border-dashed border-border bg-transparent text-sm outline-none transition-colors focus:border-solid focus:border-primary",
          align === "right" && "text-right",
          align === "left" && "text-left",
          align === "center" && "text-center",
        )}
      />
    </td>
  )
}

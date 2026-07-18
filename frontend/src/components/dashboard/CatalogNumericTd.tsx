import { useEffect, useState } from "react"
import { formatWithCommas, stripNonDigits } from "./format"

export function CatalogNumericTd({
  value,
  onChange,
  placeholder = "—",
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  const [display, setDisplay] = useState(() => formatWithCommas(value))

  useEffect(() => {
    setDisplay(formatWithCommas(value))
  }, [value])

  return (
    <td className="h-14 border-r border-border/60 px-4 py-4 text-right">
      <input
        type="text"
        inputMode="numeric"
        value={display}
        placeholder={placeholder}
        onChange={(e) => {
          const raw = e.target.value
          const digits = stripNonDigits(raw)
          setDisplay(formatWithCommas(digits))
          onChange(digits)
        }}
        className="h-9 w-24 border-b border-dashed border-border bg-transparent text-right text-sm text-foreground outline-none transition-colors focus:border-solid focus:border-primary"
      />
    </td>
  )
}

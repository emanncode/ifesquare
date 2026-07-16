import { useEffect, useRef, useState } from "react"
import { formatWithCommas, stripNonDigits } from "./format"

export function HistoryEditableTd({
  value,
  onChange,
  placeholder = "0",
}: {
  value: number | null
  onChange: (v: string) => void
  placeholder?: string
}) {
  const rawProp = value != null ? String(value) : ""
  const [display, setDisplay] = useState(() => formatWithCommas(rawProp))
  const prevRaw = useRef(rawProp)

  useEffect(() => {
    if (rawProp !== prevRaw.current) {
      prevRaw.current = rawProp
      setDisplay(formatWithCommas(rawProp))
    }
  }, [rawProp])

  return (
    <td className="px-2 py-3 text-right">
      <input
        type="text"
        inputMode="numeric"
        value={display}
        placeholder={placeholder}
        onChange={(e) => {
          const digits = stripNonDigits(e.target.value)
          setDisplay(formatWithCommas(digits))
        }}
        onBlur={(e) => {
          const digits = stripNonDigits(e.target.value)
          const raw = digits || ""
          if (raw !== rawProp) onChange(raw)
        }}
        className="h-8 w-full min-w-16 border-b border-dashed border-border bg-transparent text-right text-sm text-foreground outline-none transition-colors focus:border-solid focus:border-primary"
      />
    </td>
  )
}

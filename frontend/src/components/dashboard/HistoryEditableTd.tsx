import { useState } from "react"
import { formatWithCommas, stripNonDigits } from "./format"

export function HistoryEditableTd({
  value,
  onChange,
  placeholder = "—",
}: {
  value: number | null
  onChange: (v: string) => void
  placeholder?: string
}) {
  const rawProp = value != null ? String(value) : ""
  const expected = formatWithCommas(rawProp)
  const [display, setDisplay] = useState(expected)
  const [prevRaw, setPrevRaw] = useState(rawProp)

  if (rawProp !== prevRaw) {
    setPrevRaw(rawProp)
    setDisplay(expected)
  }

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

import { useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
import { formatWithCommas, stripNonDigits } from "./format"

export function NumericInput({
  value,
  onChange,
  placeholder,
  id,
}: {
  value: string
  onChange: (v: string) => void
  placeholder: string
  id: string
}) {
  const [display, setDisplay] = useState(() => formatWithCommas(value))

  useEffect(() => {
    setDisplay(formatWithCommas(value))
  }, [value])

  return (
    <Input
      id={id}
      type="text"
      inputMode="numeric"
      value={display}
      onChange={(e) => {
        const digits = stripNonDigits(e.target.value)
        setDisplay(formatWithCommas(digits))
        onChange(digits)
      }}
      placeholder={placeholder}
    />
  )
}

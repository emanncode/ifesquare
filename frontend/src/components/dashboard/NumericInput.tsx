import { useState } from "react"
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
  const expected = formatWithCommas(value)
  const [display, setDisplay] = useState(expected)
  const [prevExpected, setPrevExpected] = useState(expected)

  if (prevExpected !== expected) {
    setPrevExpected(expected)
    setDisplay(expected)
  }

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

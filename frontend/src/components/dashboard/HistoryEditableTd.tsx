export function HistoryEditableTd({
  value,
  onChange,
  placeholder = "0",
}: {
  value: number | null
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <td className="px-2 py-3 text-right">
      <input
        type="text"
        inputMode="numeric"
        defaultValue={value != null ? String(value) : ""}
        placeholder={placeholder}
        onBlur={(e) => {
          const v = e.target.value.trim()
          if (v && v !== String(value)) onChange(v)
        }}
        className="h-8 w-full min-w-16 border-b border-dashed border-border bg-transparent text-right text-sm text-foreground outline-none transition-colors focus:border-solid focus:border-primary"
      />
    </td>
  )
}

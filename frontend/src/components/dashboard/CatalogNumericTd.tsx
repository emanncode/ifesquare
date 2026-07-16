export function CatalogNumericTd({
  value,
  onChange,
  placeholder = "0",
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <td className="h-14 px-4 py-4 text-right">
      <input
        type="text"
        inputMode="numeric"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-full border-b border-dashed border-border bg-transparent text-right text-sm text-foreground outline-none transition-colors focus:border-solid focus:border-primary"
      />
    </td>
  )
}

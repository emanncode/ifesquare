export default function BrandMark() {
  return (
    <div className="relative flex size-11 items-center justify-center">
      <div
        className="absolute inset-0 rounded-xl"
        style={{
          background:
            "linear-gradient(145deg, oklch(0.6 0.14 150), oklch(0.4 0.1 150))",
        }}
      />
      <div className="relative flex size-8.5 items-center justify-center rounded-[10px] bg-white/95">
        <span className="text-xs font-bold tracking-tight text-primary">
          IS
        </span>
      </div>
    </div>
  );
}

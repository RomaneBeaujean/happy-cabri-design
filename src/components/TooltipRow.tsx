export default function TooltipRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex items-center justify-between gap-200">
      <span className="text-neutral-400">{label}</span>
      <span className="font-bold" style={{ color: color ?? 'var(--color-neutral-800)' }}>{value}</span>
    </div>
  )
}

type Props = { current: number; total: number }

export function ProgressBar({ current, total }: Props) {
  const percent = total === 0 ? 0 : Math.round((current / total) * 100)
  return (
    <div className="grid gap-1">
      <p className="text-sm text-ink-muted">
        {current} / {total}
      </p>
      <div className="h-2 overflow-hidden rounded-full bg-line-soft">
        <div className="h-full bg-blue-600 transition-all" style={{ width: `${percent}%` }} />
      </div>
    </div>
  )
}

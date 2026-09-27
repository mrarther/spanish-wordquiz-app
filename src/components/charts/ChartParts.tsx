import type { ReactNode } from 'react'

/** ツールチップ：値を強調し、ラベルを添える。位置はグラフ内の x（px）に合わせ、端ではみ出さないようにする */
export function Tooltip(props: {
  x: number
  width: number
  title: string
  value: string
  detail?: string
}) {
  const TIP_WIDTH = 140
  const left = Math.min(Math.max(props.x - TIP_WIDTH / 2, 0), Math.max(props.width - TIP_WIDTH, 0))
  return (
    <div
      className="pointer-events-none absolute top-0 z-10 rounded-md border border-line bg-surface px-2 py-1 text-xs shadow-sm"
      style={{ left, width: TIP_WIDTH }}
      role="presentation"
    >
      <p className="text-base font-semibold text-ink">{props.value}</p>
      <p style={{ color: 'var(--chart-text-secondary)' }}>{props.title}</p>
      {props.detail && <p style={{ color: 'var(--chart-text-muted)' }}>{props.detail}</p>}
    </div>
  )
}

/** グラフと同じ値を表で見られるようにする（ツールチップだけに頼らないため） */
export function TableView(props: {
  caption: string
  headers: string[]
  rows: (string | number)[][]
}) {
  return (
    <details className="text-sm">
      <summary className="cursor-pointer text-link">表で見る</summary>
      <table className="mt-2 w-full border-collapse tabular-nums">
        <caption className="sr-only">{props.caption}</caption>
        <thead>
          <tr>
            {props.headers.map((h) => (
              <th
                key={h}
                scope="col"
                className="border-b border-line px-2 py-1 text-left font-semibold"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {props.rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td key={j} className="border-b border-line-soft px-2 py-1">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  )
}

/** 数値タイル：ラベル・値・補足 */
export function StatTile(props: { label: string; value: ReactNode; note?: string }) {
  return (
    <div className="grid gap-1 rounded-lg border border-line-soft p-3">
      <p className="text-xs" style={{ color: 'var(--chart-text-secondary)' }}>
        {props.label}
      </p>
      <p className="text-2xl font-semibold text-ink">{props.value}</p>
      {props.note && (
        <p className="text-xs" style={{ color: 'var(--chart-text-muted)' }}>
          {props.note}
        </p>
      )}
    </div>
  )
}

/** 横棒の一覧（1系列・1色）。値は棒の先に表示する */
export function BarList(props: {
  items: { key: string; label: string; percent: number; valueLabel: string }[]
  ariaLabel: string
}) {
  return (
    <ul className="grid gap-2" aria-label={props.ariaLabel}>
      {props.items.map((item) => (
        <li key={item.key} className="grid grid-cols-[8.5rem_1fr] items-center gap-2 text-sm">
          <span
            className="truncate"
            style={{ color: 'var(--chart-text-secondary)' }}
            title={item.label}
          >
            {item.label}
          </span>
          <span className="flex items-center gap-2">
            {item.percent > 0 && (
              <span
                className="h-3 rounded-r"
                style={{ width: `${item.percent * 0.7}%`, background: 'var(--chart-series-1)' }}
                aria-hidden
              />
            )}
            <span className="shrink-0 text-xs tabular-nums text-ink">{item.valueLabel}</span>
          </span>
        </li>
      ))}
    </ul>
  )
}

import { useState } from 'react'
import { Tooltip } from './ChartParts'
import { labelStep } from './scale'
import { useWidth } from './useWidth'

export type LinePoint = { key: string; label: string; value: number | null; detail?: string }

const HEIGHT = 170
const M = { top: 20, right: 36, bottom: 22, left: 36 }

/**
 * 折れ線グラフ（1系列、y は 0〜100%）。値のない点（null）で線を切る。
 * ホバー・フォーカスで縦の補助線とツールチップを出し、最後の値だけ線の端に表示する
 */
export function LineChart(props: { data: LinePoint[]; ariaLabel: string }) {
  const [ref, width] = useWidth<HTMLDivElement>()
  const [active, setActive] = useState<number | null>(null)
  const { data } = props
  const plotW = Math.max(width - M.left - M.right, 0)
  const plotH = HEIGHT - M.top - M.bottom
  const band = data.length ? plotW / data.length : 0
  const step = labelStep(band)
  const y = (v: number) => M.top + plotH - (v / 100) * plotH
  const cx = (i: number) => M.left + band * i + band / 2

  // null で区切った連続部分ごとに線を引く
  const segments: string[] = []
  let current: string[] = []
  data.forEach((d, i) => {
    if (d.value === null) {
      if (current.length > 1) segments.push(current.join(' '))
      current = []
    } else current.push(`${current.length ? 'L' : 'M'}${cx(i)},${y(d.value)}`)
  })
  if (current.length > 1) segments.push(current.join(' '))

  const lastIndex = data.findLastIndex((d) => d.value !== null)
  const fmt = (v: number | null) => (v === null ? 'データなし' : `${v}%`)

  return (
    <div ref={ref} className="relative">
      {width > 0 && (
        <svg width={width} height={HEIGHT} role="group" aria-label={props.ariaLabel}>
          {[0, 50, 100].map((t) => (
            <g key={t}>
              <line
                x1={M.left}
                x2={width - M.right}
                y1={y(t)}
                y2={y(t)}
                stroke={t === 0 ? 'var(--chart-axis)' : 'var(--chart-grid)'}
                strokeWidth={1}
              />
              <text
                x={M.left - 6}
                y={y(t)}
                textAnchor="end"
                dominantBaseline="middle"
                fontSize={11}
                fill="var(--chart-text-muted)"
                className="tabular-nums"
              >
                {t}%
              </text>
            </g>
          ))}
          {active !== null && (
            <line
              x1={cx(active)}
              x2={cx(active)}
              y1={M.top}
              y2={M.top + plotH}
              stroke="var(--chart-axis)"
              strokeWidth={1}
            />
          )}
          {segments.map((d) => (
            <path
              key={d}
              d={d}
              fill="none"
              stroke="var(--chart-series-1)"
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          ))}
          {data.map((d, i) => (
            <g key={d.key}>
              {d.value !== null && (
                <circle
                  cx={cx(i)}
                  cy={y(d.value)}
                  r={active === i ? 5 : 4}
                  fill="var(--chart-series-1)"
                  stroke="var(--chart-surface)"
                  strokeWidth={2}
                />
              )}
              {(data.length - 1 - i) % step === 0 && (
                <text
                  x={cx(i)}
                  y={HEIGHT - 6}
                  textAnchor="middle"
                  fontSize={11}
                  fill="var(--chart-text-muted)"
                >
                  {d.label}
                </text>
              )}
              <rect
                x={M.left + band * i}
                y={M.top}
                width={band}
                height={plotH}
                fill="transparent"
                tabIndex={0}
                aria-label={`${d.label}：${fmt(d.value)}${d.detail ? `（${d.detail}）` : ''}`}
                onPointerEnter={() => setActive(i)}
                onPointerLeave={() => setActive(null)}
                onFocus={() => setActive(i)}
                onBlur={() => setActive(null)}
                className="outline-none focus-visible:stroke-blue-600"
              />
            </g>
          ))}
          {lastIndex >= 0 && (
            <text
              x={cx(lastIndex) + 8}
              y={y(data[lastIndex].value!)}
              dominantBaseline="middle"
              fontSize={11}
              fill="var(--chart-text-secondary)"
            >
              {data[lastIndex].value}%
            </text>
          )}
        </svg>
      )}
      {active !== null && data[active] && (
        <Tooltip
          x={cx(active)}
          width={width}
          title={data[active].label}
          value={fmt(data[active].value)}
          detail={data[active].detail}
        />
      )}
    </div>
  )
}

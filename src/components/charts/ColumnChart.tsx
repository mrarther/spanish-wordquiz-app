import { useState } from 'react'
import { Tooltip } from './ChartParts'
import { columnPath, labelStep, niceMax } from './scale'
import { useWidth } from './useWidth'

export type ColumnDatum = { key: string; label: string; value: number; detail?: string }

const HEIGHT = 170
const M = { top: 20, right: 8, bottom: 22, left: 32 }

/**
 * 縦棒グラフ（1系列）。棒は最大 24px、上端だけ角丸。
 * 棒ごとにホバー・フォーカスで値を表示し、いちばん大きい値だけ棒の上に表示する
 */
export function ColumnChart(props: {
  data: ColumnDatum[]
  ariaLabel: string
  formatValue: (v: number) => string
}) {
  const [ref, width] = useWidth<HTMLDivElement>()
  const [active, setActive] = useState<number | null>(null)
  const { data } = props
  const plotW = Math.max(width - M.left - M.right, 0)
  const plotH = HEIGHT - M.top - M.bottom
  const yMax = niceMax(Math.max(...data.map((d) => d.value), 0))
  const band = data.length ? plotW / data.length : 0
  const barW = Math.min(24, band * 0.6)
  const step = labelStep(band)
  const maxIndex = data.reduce((best, d, i) => (d.value > data[best].value ? i : best), 0)
  const y = (v: number) => M.top + plotH - (v / yMax) * plotH
  const cx = (i: number) => M.left + band * i + band / 2

  return (
    <div ref={ref} className="relative">
      {width > 0 && (
        <svg width={width} height={HEIGHT} role="group" aria-label={props.ariaLabel}>
          {[0, yMax / 2, yMax].map((t) => (
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
                {props.formatValue(t)}
              </text>
            </g>
          ))}
          {data.map((d, i) => {
            const top = y(d.value)
            return (
              <g key={d.key}>
                <path
                  d={columnPath(cx(i) - barW / 2, top, barW, M.top + plotH - top)}
                  fill="var(--chart-series-1)"
                  opacity={active === null || active === i ? 1 : 0.55}
                />
                {i === maxIndex && d.value > 0 && (
                  <text
                    x={cx(i)}
                    y={top - 6}
                    textAnchor="middle"
                    fontSize={11}
                    fill="var(--chart-text-secondary)"
                  >
                    {props.formatValue(d.value)}
                  </text>
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
                {/* 当たり判定は棒より広い帯全体 */}
                <rect
                  x={M.left + band * i}
                  y={M.top}
                  width={band}
                  height={plotH}
                  fill="transparent"
                  tabIndex={0}
                  aria-label={`${d.label}：${props.formatValue(d.value)}${d.detail ? `（${d.detail}）` : ''}`}
                  onPointerEnter={() => setActive(i)}
                  onPointerLeave={() => setActive(null)}
                  onFocus={() => setActive(i)}
                  onBlur={() => setActive(null)}
                  className="outline-none focus-visible:stroke-blue-600"
                />
              </g>
            )
          })}
        </svg>
      )}
      {active !== null && data[active] && (
        <Tooltip
          x={cx(active)}
          width={width}
          title={data[active].label}
          value={props.formatValue(data[active].value)}
          detail={data[active].detail}
        />
      )}
    </div>
  )
}

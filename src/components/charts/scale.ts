/** 目盛りの上限を 1・2・5 × 10^n のきりのよい値に切り上げる（0 以下なら 1） */
export function niceMax(value: number): number {
  if (value <= 0) return 1
  const magnitude = 10 ** Math.floor(Math.log10(value))
  const step = [1, 2, 5, 10].find((s) => s * magnitude >= value) ?? 10
  return step * magnitude
}

/** x 軸のラベルを何本おきに出すか（最後のラベルは必ず出す） */
export function labelStep(bandWidth: number, minLabelWidth = 36): number {
  return Math.max(1, Math.ceil(minLabelWidth / bandWidth))
}

/** 上の角だけ丸めた棒のパス（下端は四角） */
export function columnPath(
  x: number,
  y: number,
  width: number,
  height: number,
  radius = 4,
): string {
  if (height <= 0) return ''
  const r = Math.min(radius, height, width / 2)
  const base = y + height
  return `M${x},${base}V${y + r}Q${x},${y} ${x + r},${y}H${x + width - r}Q${x + width},${y} ${x + width},${y + r}V${base}Z`
}

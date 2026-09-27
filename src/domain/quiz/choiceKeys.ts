/** 押されたキー（KeyboardEvent.key）から4択の番号（0 始まり）を求める。対象外なら null */
export function choiceIndexFromKey(key: string, count: number): number | null {
  if (!/^[1-9]$/.test(key)) return null
  const index = Number(key) - 1
  return index < count ? index : null
}

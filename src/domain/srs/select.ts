import { shuffle, type Rng } from '../../utils/random'

export type DueInfo = { due: number }

/**
 * SRS の進捗を見て出題する項目を選ぶ。
 * 優先順：復習時期が来た項目（期限切れの古い順）→ まだ解いたことのない項目 → 復習時期がまだの項目（近い順）。
 * 選んだ項目は、出題の順番だけシャッフルする
 */
export function prioritize<T>(
  pool: readonly T[],
  idOf: (item: T) => string,
  progress: ReadonlyMap<string, DueInfo>,
  count: number,
  now: number,
  rng: Rng = Math.random,
): T[] {
  const due: T[] = []
  const fresh: T[] = []
  const later: T[] = []
  for (const item of pool) {
    const p = progress.get(idOf(item))
    if (!p) fresh.push(item)
    else if (p.due <= now) due.push(item)
    else later.push(item)
  }
  const byDue = (a: T, b: T) => progress.get(idOf(a))!.due - progress.get(idOf(b))!.due
  const picked = [...due.sort(byDue), ...shuffle(fresh, rng), ...later.sort(byDue)].slice(0, count)
  return shuffle(picked, rng)
}

import { TENSES, type Tense } from '../conjugation/types'
import { parseConjItemId, type ItemType } from '../srs/items'

/** 統計に使う回答履歴（db の attempts と同じ形） */
export type AttemptLike = { itemId: string; type: ItemType; correct: boolean; at: number }

export type Tally = { total: number; correct: number }

/** 端末のタイムゾーンでの日付（YYYY-MM-DD） */
export function localDayKey(ts: number): string {
  const d = new Date(ts)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-${dd}`
}

function addDays(ts: number, days: number): number {
  const d = new Date(ts)
  d.setDate(d.getDate() + days)
  return d.getTime()
}

export type DayActivity = Tally & { date: string; label: string }

/** 直近 days 日（今日を含む）の日別の回答数と正解数。古い順 */
export function dailyActivity(
  attempts: readonly AttemptLike[],
  days: number,
  now: number,
): DayActivity[] {
  const byDay = new Map<string, Tally>()
  for (const a of attempts) {
    const t = byDay.get(localDayKey(a.at)) ?? { total: 0, correct: 0 }
    t.total++
    if (a.correct) t.correct++
    byDay.set(localDayKey(a.at), t)
  }
  return Array.from({ length: days }, (_, i) => {
    const ts = addDays(now, i - days + 1)
    const d = new Date(ts)
    const date = localDayKey(ts)
    return {
      date,
      label: `${d.getMonth() + 1}/${d.getDate()}`,
      ...(byDay.get(date) ?? { total: 0, correct: 0 }),
    }
  })
}

/**
 * 連続学習日数。今日回答していればそこから、まだなら昨日から数える
 * （今日これから学習すれば記録は続くため）
 */
export function studyStreak(attempts: readonly AttemptLike[], now: number): number {
  const days = new Set(attempts.map((a) => localDayKey(a.at)))
  let ts = days.has(localDayKey(now)) ? now : addDays(now, -1)
  let streak = 0
  while (days.has(localDayKey(ts))) {
    streak++
    ts = addDays(ts, -1)
  }
  return streak
}

export function tally(attempts: readonly AttemptLike[]): Tally {
  return { total: attempts.length, correct: attempts.filter((a) => a.correct).length }
}

export function accuracyByType(attempts: readonly AttemptLike[]): Record<ItemType, Tally> {
  const of = (type: ItemType) => tally(attempts.filter((a) => a.type === type))
  return { conj: of('conj'), vocab: of('vocab'), cloze: of('cloze') }
}

export type TenseTally = Tally & { tense: Tense }

/** 活用の回答を時制ごとに集計し、正答率の低い順（同じなら回答数の多い順）に並べる */
export function tenseAccuracy(attempts: readonly AttemptLike[]): TenseTally[] {
  const byTense = new Map<Tense, Tally>()
  for (const a of attempts) {
    const tense = parseConjItemId(a.itemId)?.tense
    if (!tense || !(tense in TENSES)) continue
    const t = byTense.get(tense as Tense) ?? { total: 0, correct: 0 }
    t.total++
    if (a.correct) t.correct++
    byTense.set(tense as Tense, t)
  }
  return [...byTense]
    .map(([tense, t]) => ({ tense, ...t }))
    .sort((a, b) => a.correct / a.total - b.correct / b.total || b.total - a.total)
}

export type WeakItem = { itemId: string; total: number; wrong: number }

/** 間違えた回数の多い項目（同じなら正答率の低い順）。1回も間違えていない項目は含めない */
export function weakItems(
  attempts: readonly AttemptLike[],
  type: ItemType,
  limit = 10,
): WeakItem[] {
  const byItem = new Map<string, WeakItem>()
  for (const a of attempts) {
    if (a.type !== type) continue
    const w = byItem.get(a.itemId) ?? { itemId: a.itemId, total: 0, wrong: 0 }
    w.total++
    if (!a.correct) w.wrong++
    byItem.set(a.itemId, w)
  }
  return [...byItem.values()]
    .filter((w) => w.wrong > 0)
    .sort((a, b) => b.wrong - a.wrong || b.wrong / b.total - a.wrong / a.total)
    .slice(0, limit)
}

export type TestPoint = {
  at: number
  label: string
  percent: number
  correct: number
  total: number
}

/** 総合テストの結果を古い順に、正答率（%）の推移にする */
export function testTrend(
  results: readonly { at: number; correct: number; total: number }[],
): TestPoint[] {
  return [...results]
    .sort((a, b) => a.at - b.at)
    .map((r) => {
      const d = new Date(r.at)
      return {
        at: r.at,
        label: `${d.getMonth() + 1}/${d.getDate()}`,
        percent: r.total === 0 ? 0 : Math.round((r.correct / r.total) * 100),
        correct: r.correct,
        total: r.total,
      }
    })
}

/** 正答率（%、四捨五入）。回答がなければ null */
export function accuracy(t: Tally): number | null {
  return t.total === 0 ? null : Math.round((t.correct / t.total) * 100)
}

export const DAY = 24 * 60 * 60 * 1000
/** 間違えた項目は、この時間が経つと再び出題対象になる */
export const RELEARN_DELAY = 10 * 60 * 1000

export type SrsState = {
  /** 難しさの係数（初期値 2.5、下限 1.3） */
  ease: number
  /** 次の復習までの間隔（日） */
  interval: number
  /** 連続で正解した回数 */
  reps: number
  /** 間違えた回数の累計 */
  lapses: number
  /** 次に出題する時刻（ミリ秒） */
  due: number
  lastReviewed: number
}

/** 0〜5 の回答の質。3 以上が正解 */
export type Quality = 0 | 1 | 2 | 3 | 4 | 5

/** 正解 → 4、アクセントの違いだけで正解 → 3、不正解 → 1 */
export function qualityOf(result: { correct: boolean; accentMistake: boolean }): Quality {
  if (!result.correct) return 1
  return result.accentMistake ? 3 : 4
}

/** SM-2 で次の状態を計算する。prev が undefined なら初めての回答 */
export function review(prev: SrsState | undefined, quality: Quality, now: number): SrsState {
  const ease0 = prev?.ease ?? 2.5
  const ease = Math.max(1.3, ease0 + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)))

  if (quality < 3) {
    return {
      ease,
      interval: 0,
      reps: 0,
      lapses: (prev?.lapses ?? 0) + 1,
      due: now + RELEARN_DELAY,
      lastReviewed: now,
    }
  }

  const reps = (prev?.reps ?? 0) + 1
  const interval = reps === 1 ? 1 : reps === 2 ? 6 : Math.round((prev?.interval ?? 1) * ease0)
  return {
    ease,
    interval,
    reps,
    lapses: prev?.lapses ?? 0,
    due: now + interval * DAY,
    lastReviewed: now,
  }
}

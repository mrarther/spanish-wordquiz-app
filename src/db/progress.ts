import type { ItemType } from '../domain/srs/items'
import { qualityOf, review } from '../domain/srs/sm2'
import { db as defaultDb, type AppDB, type AttemptRow, type ProgressRow } from './db'

export type AnswerResult = {
  itemId: string
  type: ItemType
  correct: boolean
  accentMistake: boolean
}

/** 回答を履歴に追加し、SM-2 で次の復習時期を更新する */
export async function recordAnswer(
  answer: AnswerResult,
  now = Date.now(),
  db: AppDB = defaultDb,
): Promise<ProgressRow> {
  return db.transaction('rw', db.progress, db.attempts, async () => {
    const prev = await db.progress.get(answer.itemId)
    const next: ProgressRow = {
      ...review(prev, qualityOf(answer), now),
      itemId: answer.itemId,
      type: answer.type,
    }
    await db.progress.put(next)
    await db.attempts.add({
      itemId: answer.itemId,
      type: answer.type,
      correct: answer.correct,
      accentMistake: answer.accentMistake,
      at: now,
    })
    return next
  })
}

/** 画面からの記録用。保存に失敗しても学習は続けられるよう、エラーはログに出すだけにする */
export function saveAnswer(answer: AnswerResult): void {
  recordAnswer(answer).catch((e) => console.error('回答の保存に失敗しました', e))
}

export async function getProgressMap(
  type: ItemType,
  db: AppDB = defaultDb,
): Promise<Map<string, ProgressRow>> {
  const rows = await db.progress.where('type').equals(type).toArray()
  return new Map(rows.map((r) => [r.itemId, r]))
}

/** 復習時期が来た項目（期限切れの古い順） */
export async function getDueItems(
  type: ItemType,
  now = Date.now(),
  db: AppDB = defaultDb,
): Promise<ProgressRow[]> {
  return db.progress.where('[type+due]').between([type, 0], [type, now], true, true).toArray()
}

/** 回答履歴をすべて返す（統計画面用） */
export async function listAttempts(db: AppDB = defaultDb): Promise<AttemptRow[]> {
  return db.attempts.toArray()
}

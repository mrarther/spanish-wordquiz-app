import 'fake-indexeddb/auto'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { DAY, RELEARN_DELAY } from '../domain/srs/sm2'
import { deleteCustomCloze, listCustomCloze, putCustomCloze } from './cloze'
import { AppDB } from './db'
import { getDueItems, getProgressMap, recordAnswer } from './progress'
import { loadSetting, saveSetting } from './settings'
import { addTestResult, listTestResults } from './testResults'

const NOW = Date.UTC(2026, 8, 26)
let db: AppDB

beforeEach(() => {
  db = new AppDB(`test-${Math.random()}`)
})

afterEach(async () => {
  await db.delete()
})

describe('recordAnswer', () => {
  it('進捗を作成・更新し、回答履歴を追加する', async () => {
    const answer = { itemId: 'conj:hablar:present:0', type: 'conj' as const, accentMistake: false }
    await recordAnswer({ ...answer, correct: true }, NOW, db)
    let row = await db.progress.get(answer.itemId)
    expect(row).toMatchObject({ type: 'conj', reps: 1, due: NOW + DAY })

    await recordAnswer({ ...answer, correct: false }, NOW + DAY, db)
    row = await db.progress.get(answer.itemId)
    expect(row).toMatchObject({ reps: 0, lapses: 1, due: NOW + DAY + RELEARN_DELAY })

    const attempts = await db.attempts.toArray()
    expect(attempts.map((a) => a.correct)).toEqual([true, false])
  })
})

describe('進捗の読み込み', () => {
  it('種類ごとの進捗と、復習時期が来た項目を取得する', async () => {
    await recordAnswer(
      { itemId: 'conj:a', type: 'conj', correct: false, accentMistake: false },
      NOW,
      db,
    )
    await recordAnswer(
      { itemId: 'conj:b', type: 'conj', correct: true, accentMistake: false },
      NOW,
      db,
    )
    await recordAnswer(
      { itemId: 'vocab:c', type: 'vocab', correct: false, accentMistake: false },
      NOW,
      db,
    )

    const conj = await getProgressMap('conj', db)
    expect([...conj.keys()].sort()).toEqual(['conj:a', 'conj:b'])

    // 1時間後：間違えた conj:a だけが復習対象（conj:b は翌日）
    const due = await getDueItems('conj', NOW + 60 * 60 * 1000, db)
    expect(due.map((r) => r.itemId)).toEqual(['conj:a'])
    expect(await getDueItems('conj', NOW, db)).toEqual([])
  })
})

describe('設定', () => {
  it('保存した値を読み込める', async () => {
    expect(await loadSetting('x', db)).toBeUndefined()
    await saveSetting('x', { count: 20 }, db)
    expect(await loadSetting('x', db)).toEqual({ count: 20 })
  })
})

describe('自作の穴埋め問題', () => {
  it('追加・上書き・削除でき、新しく更新した順に並ぶ', async () => {
    const base = {
      translation_ja: '訳',
      kind: 'vocab' as const,
      tags: [],
      level: 'A1' as const,
      source: 'custom' as const,
    }
    await putCustomCloze(
      [
        { ...base, id: 'a', sentence: '[[uno]]', updatedAt: 1 },
        { ...base, id: 'b', sentence: '[[dos]]', updatedAt: 2 },
      ],
      db,
    )
    await putCustomCloze([{ ...base, id: 'a', sentence: '[[tres]]', updatedAt: 3 }], db)
    let list = await listCustomCloze(db)
    expect(list.map((i) => [i.id, i.sentence])).toEqual([
      ['a', '[[tres]]'],
      ['b', '[[dos]]'],
    ])
    await deleteCustomCloze('a', db)
    list = await listCustomCloze(db)
    expect(list.map((i) => i.id)).toEqual(['b'])
  })
})

describe('総合テストの結果', () => {
  it('保存した結果を新しい順に読み込む', async () => {
    const row = {
      durationMs: 1000,
      timeLimitMin: null,
      timedOut: false,
      format: 'input' as const,
      range: {
        sections: ['conj' as const],
        tenses: ['present' as const],
        levels: ['A1' as const],
        categories: [],
        includeVosotros: true,
        includeCustom: false,
      },
      total: 10,
      bySection: {
        conj: { total: 10, correct: 5 },
        vocab: { total: 0, correct: 0 },
        cloze: { total: 0, correct: 0 },
      },
      wrongItemIds: [],
    }
    await addTestResult({ ...row, at: 1, correct: 5 }, db)
    await addTestResult({ ...row, at: 2, correct: 8 }, db)
    expect((await listTestResults(undefined, db)).map((r) => r.correct)).toEqual([8, 5])
    expect(await listTestResults(1, db)).toHaveLength(1)
  })
})

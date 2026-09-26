import Dexie, { type EntityTable } from 'dexie'
import type { ClozeItem } from '../domain/cloze/types'
import type { ItemType } from '../domain/srs/items'
import type { TestRange, TestSection } from '../domain/test/compose'
import type { SectionScore } from '../domain/test/score'
import type { SrsState } from '../domain/srs/sm2'

export type ProgressRow = SrsState & { itemId: string; type: ItemType }

export type AttemptRow = {
  id?: number
  itemId: string
  type: ItemType
  correct: boolean
  accentMistake: boolean
  at: number
}

export type SettingRow = { key: string; value: unknown }

export type TestResultRow = {
  id?: number
  /** 採点した時刻 */
  at: number
  durationMs: number
  timeLimitMin: number | null
  timedOut: boolean
  format: 'input' | 'choice'
  range: TestRange
  total: number
  correct: number
  bySection: Record<TestSection, SectionScore>
  /** 間違えた・未回答の問題の SRS 項目 id */
  wrongItemIds: string[]
}

export class AppDB extends Dexie {
  progress!: EntityTable<ProgressRow, 'itemId'>
  attempts!: EntityTable<AttemptRow, 'id'>
  settings!: EntityTable<SettingRow, 'key'>
  customCloze!: EntityTable<ClozeItem, 'id'>
  testResults!: EntityTable<TestResultRow, 'id'>

  constructor(name = 'spanish-wordquiz') {
    super(name)
    // テーブルを追加・変更するときは version を上げる。前の version の定義は消さずに残す
    this.version(1).stores({
      progress: 'itemId, type, [type+due]',
      attempts: '++id, itemId, type, at',
      settings: 'key',
    })
    // 自作の穴埋め問題
    this.version(2).stores({ customCloze: 'id, updatedAt' })
    // 総合テストの結果
    this.version(3).stores({ testResults: '++id, at' })
  }
}

export const db = new AppDB()

import Dexie, { type EntityTable } from 'dexie'
import type { ClozeItem } from '../domain/cloze/types'
import type { ItemType } from '../domain/srs/items'
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

export class AppDB extends Dexie {
  progress!: EntityTable<ProgressRow, 'itemId'>
  attempts!: EntityTable<AttemptRow, 'id'>
  settings!: EntityTable<SettingRow, 'key'>
  customCloze!: EntityTable<ClozeItem, 'id'>

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
  }
}

export const db = new AppDB()

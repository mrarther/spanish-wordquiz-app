import Dexie, { type EntityTable } from 'dexie'
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

  constructor(name = 'spanish-wordquiz') {
    super(name)
    // テーブルを追加・変更するときは version を上げる（customCloze・testResults はフェーズ7・8で追加する）
    this.version(1).stores({
      progress: 'itemId, type, [type+due]',
      attempts: '++id, itemId, type, at',
      settings: 'key',
    })
  }
}

export const db = new AppDB()

import type { ClozeItem } from '../domain/cloze/types'
import { db as defaultDb, type AppDB } from './db'

/** 自作の穴埋め問題を、新しく更新した順に返す */
export async function listCustomCloze(db: AppDB = defaultDb): Promise<ClozeItem[]> {
  return db.customCloze.orderBy('updatedAt').reverse().toArray()
}

/** 追加・更新（同じ id なら上書き） */
export async function putCustomCloze(items: ClozeItem[], db: AppDB = defaultDb) {
  await db.customCloze.bulkPut(items)
}

export async function deleteCustomCloze(id: string, db: AppDB = defaultDb) {
  await db.customCloze.delete(id)
}

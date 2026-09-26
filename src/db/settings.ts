import { db as defaultDb, type AppDB } from './db'

export async function loadSetting<T>(key: string, db: AppDB = defaultDb): Promise<T | undefined> {
  return (await db.settings.get(key))?.value as T | undefined
}

export async function saveSetting(key: string, value: unknown, db: AppDB = defaultDb) {
  await db.settings.put({ key, value })
}

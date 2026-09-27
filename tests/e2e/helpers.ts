import type { Page } from '@playwright/test'

export type Seed = {
  attempts: { itemId: string; type: string; correct: boolean; daysAgo: number }[]
  tests: { correct: number; total: number; daysAgo: number }[]
}

/** アプリが作った IndexedDB に、回答履歴と総合テストの結果を直接書き込む */
export async function seed(page: Page, data: Seed) {
  await page.evaluate(
    (d) =>
      new Promise<void>((resolve, reject) => {
        const DAY = 24 * 60 * 60 * 1000
        const open = indexedDB.open('spanish-wordquiz')
        open.onsuccess = () => {
          const tx = open.result.transaction(['attempts', 'testResults'], 'readwrite')
          for (const a of d.attempts) {
            tx.objectStore('attempts').add({
              itemId: a.itemId,
              type: a.type,
              correct: a.correct,
              accentMistake: false,
              at: Date.now() - a.daysAgo * DAY,
            })
          }
          for (const t of d.tests) {
            tx.objectStore('testResults').add({
              at: Date.now() - t.daysAgo * DAY,
              durationMs: 60_000,
              timeLimitMin: null,
              timedOut: false,
              format: 'input',
              range: {},
              total: t.total,
              correct: t.correct,
              bySection: {},
              wrongItemIds: [],
            })
          }
          tx.oncomplete = () => {
            open.result.close()
            resolve()
          }
          tx.onerror = () => reject(tx.error)
        }
      }),
    data,
  )
}

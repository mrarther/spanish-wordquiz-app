import { expect, test, type Page } from '@playwright/test'

type Seed = {
  attempts: { itemId: string; type: string; correct: boolean; daysAgo: number }[]
  tests: { correct: number; total: number; daysAgo: number }[]
}

/** アプリが作った IndexedDB に、回答履歴と総合テストの結果を直接書き込む */
async function seed(page: Page, data: Seed) {
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

const repeat = (n: number, a: Seed['attempts'][number]) => Array.from({ length: n }, () => a)

test('学習記録がないときは案内を表示する', async ({ page }) => {
  await page.goto('/')
  await page.getByText('統計', { exact: true }).click()
  await expect(page.getByText('まだ学習記録がありません。')).toBeVisible()
})

test('連続学習日数・正答率・苦手な時制と単語・テストの推移を表示する', async ({ page }) => {
  await page.goto('/')
  const conj = (tense: string, correct: boolean, daysAgo = 0) => ({
    itemId: `conj:hablar:${tense}:0`,
    type: 'conj',
    correct,
    daysAgo,
  })
  const vocab = (id: string, correct: boolean, daysAgo = 0) => ({
    itemId: `vocab:${id}`,
    type: 'vocab',
    correct,
    daysAgo,
  })
  await seed(page, {
    attempts: [
      // 今日・昨日・一昨日と続けて学習し、4日前にも学習（3日前が空いている）
      ...repeat(5, conj('present', true, 0)),
      conj('present', false, 1),
      conj('preterite', true, 1),
      ...repeat(3, conj('preterite', false, 2)),
      ...repeat(3, conj('subjunctivePresent', false, 4)),
      ...repeat(2, conj('imperfect', true, 0)),
      ...repeat(3, vocab('food:agua', false, 0)),
      vocab('food:agua', true, 0),
      vocab('house:libro', false, 1),
      vocab('house:libro', true, 1),
    ],
    tests: [
      { correct: 4, total: 10, daysAgo: 5 },
      { correct: 6, total: 10, daysAgo: 3 },
      { correct: 15, total: 20, daysAgo: 0 },
    ],
  })
  await page.getByText('統計', { exact: true }).click()

  const tile = (label: string) =>
    page.locator('div', { has: page.getByText(label, { exact: true }) }).last()
  await expect(tile('連続学習日数')).toContainText('3日')
  await expect(tile('回答数')).toContainText('21')
  // 正解：present 5 + imperfect 2 + preterite 1 + agua 1 + libro 1 = 10 / 21
  await expect(tile('正答率')).toContainText('48%')

  // 苦手な時制：回答が3問以上の時制だけを、正答率の低い順に
  const tenses = page.getByRole('list', { name: '時制別の正答率' }).getByRole('listitem')
  await expect(tenses).toHaveCount(3)
  await expect(tenses.nth(0)).toContainText('接続法現在0%（3問）')
  await expect(tenses.nth(1)).toContainText('直説法点過去25%（4問）')
  await expect(tenses.nth(2)).toContainText('直説法現在83%（6問）')

  // 苦手な単語：間違えた回数の多い順
  const rows = page
    .locator('table', { has: page.getByText('間違えた回数の多い単語') })
    .locator('tbody tr')
  await expect(rows).toHaveCount(2)
  await expect(rows.nth(0)).toContainText('el agua水3回25%')
  await expect(rows.nth(1)).toContainText('el libro本1回50%')

  // 日別のグラフは棒にフォーカスすると値を表示する
  const chart = page.getByRole('group', { name: '直近14日の日別の回答数' })
  await chart.locator('rect[tabindex="0"]').last().focus()
  await expect(page.getByText('正解 8問')).toBeVisible()

  // 総合テストの推移は表でも確認できる（新しい順）
  const section = page.locator('section', { hasText: '総合テストのスコア推移' })
  await section.getByText('表で見る').click()
  const testRows = section.locator('tbody tr')
  await expect(testRows).toHaveCount(3)
  await expect(testRows.nth(0)).toContainText('15 / 2075%')
})

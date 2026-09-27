import { expect, test, type Page } from '@playwright/test'

const INFINITIVE = /^[a-záéíóúüñ]+(ar|er|ir|ír)$/

/** 語彙学習で「動詞」カテゴリだけを選び、4択で始める */
async function startVerbQuiz(page: Page, direction: string) {
  await page.goto('/vocab')
  await page.getByText('4択', { exact: true }).click()
  await page.getByText(direction, { exact: true }).click()
  await page.getByText('すべて', { exact: true }).click() // すべて外す
  await page.getByText(/^動詞（\d+）$/).click()
  await page.getByText('B1', { exact: true }).click()
  await expect(page.getByText(/^動詞（368）$/)).toBeVisible()
  await page.getByRole('button', { name: 'スタート' }).click()
}

const choiceTexts = async (page: Page) =>
  (await page.locator('div.grid-cols-2 button span.flex-1').allInnerTexts()).map((t) => t.trim())

test('日→西：動詞の意味が出題され、選択肢はすべて動詞の原形', async ({ page }) => {
  await startVerbQuiz(page, '日本語 → スペイン語')
  for (let i = 0; i < 5; i++) {
    await expect(page.locator('div.grid-cols-2 button')).toHaveCount(4)
    for (const c of await choiceTexts(page)) expect(c).toMatch(INFINITIVE)
    await page.keyboard.press('1')
    await expect(page.getByRole('status')).toBeVisible()
    await expect(page.getByText('動詞・', { exact: false })).toBeVisible()
    await page.keyboard.press('Enter')
  }
})

test('西→日：動詞の原形が出題され、選択肢は日本語の意味', async ({ page }) => {
  await startVerbQuiz(page, 'スペイン語 → 日本語')
  const prompt = (await page.locator('p.text-2xl').innerText()).trim()
  expect(prompt).toMatch(INFINITIVE)
  const texts = await choiceTexts(page)
  expect(texts).toHaveLength(4)
  for (const c of texts) expect(c).not.toMatch(/^[a-z]/)
})

import { expect, test, type Page } from '@playwright/test'

/** IndexedDB に保存された総合テストの結果の件数 */
function countTestResults(page: Page) {
  return page.evaluate(
    () =>
      new Promise<number>((resolve) => {
        const open = indexedDB.open('spanish-wordquiz')
        open.onsuccess = () => {
          const req = open.result.transaction('testResults').objectStore('testResults').count()
          req.onsuccess = () => {
            resolve(req.result)
            open.result.close()
          }
        }
      }),
  )
}

async function setup(page: Page, opts: { count: string; limit: string; format?: string }) {
  await page.goto('/')
  await page.getByText('総合テスト').click()
  await page.getByText(opts.count, { exact: true }).click()
  await page.getByText(opts.limit, { exact: true }).click()
  if (opts.format) await page.getByText(opts.format, { exact: true }).click()
}

test('3分野を混ぜて出題し、前後に移動しても回答が残り、最後にまとめて採点する', async ({
  page,
}) => {
  page.on('dialog', (d) => d.accept())
  await setup(page, { count: '10問', limit: 'なし' })
  await expect(page.getByText('活用 4問・語彙 3問・例文穴埋め 3問（計 10 問）')).toBeVisible()
  await page.getByRole('button', { name: 'テストを始める' }).click()

  // 途中では正誤を表示しない。前後に移動しても入力した答えが残る
  const input = page.getByLabel('答え')
  await input.fill('abc')
  await input.press('Enter')
  await expect(page.getByText('問題 2 / 10')).toBeVisible()
  await expect(page.getByText('正解！')).toHaveCount(0)
  await expect(page.getByText('不正解')).toHaveCount(0)
  await input.fill('def')
  await page.getByRole('button', { name: '前へ' }).click()
  await expect(input).toHaveValue('abc')
  await page.getByRole('button', { name: /^問題 2/ }).click()
  await expect(input).toHaveValue('def')
  await expect(page.getByText('（未回答 8）')).toBeVisible()

  // 未回答があっても確認して採点できる
  await page.getByRole('button', { name: '採点する' }).click()
  await expect(page.getByText('総合テストの結果')).toBeVisible()
  await expect(page.getByText('0 / 10', { exact: true })).toBeVisible()
  await expect(page.getByText('間違えた問題・未回答（10問）')).toBeVisible()
  await expect(page.getByText('（未回答）')).toHaveCount(8)
  const bySection = page.locator('section', { hasText: '分野別' }).locator('li')
  await expect(bySection).toHaveCount(3)
  await expect(bySection.nth(0)).toContainText('活用0 / 4（0%）')
  await expect.poll(() => countTestResults(page)).toBe(1)
})

test('制限時間が来ると自動的に採点する', async ({ page }) => {
  await page.clock.install()
  await setup(page, { count: '10問', limit: '5分' })
  await page.getByRole('button', { name: 'テストを始める' }).click()
  await expect(page.getByLabel('残り時間')).toHaveText('5:00')

  await page.getByLabel('答え').fill('abc')
  await page.clock.fastForward('02:00')
  await expect(page.getByLabel('残り時間')).toHaveText('3:00')

  await page.clock.fastForward('03:01')
  await expect(page.getByText('時間切れで自動的に採点しました')).toBeVisible()
  await expect(page.getByText('0 / 10', { exact: true })).toBeVisible()
  await expect.poll(() => countTestResults(page)).toBe(1)
})

test('4択では、選んだ答えと選択肢の並びが前後に移動しても変わらない', async ({ page }) => {
  await setup(page, { count: '10問', limit: 'なし', format: '4択' })
  await page.getByRole('button', { name: 'テストを始める' }).click()

  const choices = page.locator('div.grid-cols-2 button')
  await expect(choices).toHaveCount(4)
  const order = await choices.allInnerTexts()
  await choices.nth(2).click()
  await expect(choices.nth(2)).toHaveAttribute('aria-pressed', 'true')

  await page.getByRole('button', { name: '次へ' }).click()
  await page.getByRole('button', { name: '前へ' }).click()
  expect(await choices.allInnerTexts()).toEqual(order)
  await expect(choices.nth(2)).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByText('（未回答 9）')).toBeVisible()
})

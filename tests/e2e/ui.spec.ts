import { expect, test, type Page } from '@playwright/test'
import { seed } from './helpers'

const DARK_BG = 'rgb(26, 26, 25)'
const LIGHT_BG = 'rgb(255, 255, 255)'

const bodyBg = (page: Page) => page.evaluate(() => getComputedStyle(document.body).backgroundColor)
const themeAttr = (page: Page) => page.evaluate(() => document.documentElement.dataset.theme)

test.describe('テーマ', () => {
  test('ダーク・ライトを選ぶと画面に反映され、再読み込みしても残る', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' })
    await page.goto('/settings')
    await page.getByText('ダーク', { exact: true }).click()
    await expect.poll(() => themeAttr(page)).toBe('dark')
    expect(await bodyBg(page)).toBe(DARK_BG)

    await page.reload()
    await expect(page.getByRole('checkbox', { name: 'ダーク' })).toBeChecked()
    expect(await bodyBg(page)).toBe(DARK_BG)

    // 端末がダークでも、ライトを選べばライト
    await page.emulateMedia({ colorScheme: 'dark' })
    await page.getByText('ライト', { exact: true }).click()
    await expect.poll(() => bodyBg(page)).toBe(LIGHT_BG)
  })

  test('「端末に合わせる」では端末の設定に従う', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' })
    await page.goto('/settings')
    await expect(page.getByRole('checkbox', { name: '端末に合わせる' })).toBeChecked()
    expect(await themeAttr(page)).toBeUndefined()
    expect(await bodyBg(page)).toBe(DARK_BG)
    await page.emulateMedia({ colorScheme: 'light' })
    expect(await bodyBg(page)).toBe(LIGHT_BG)
  })
})

test('入力補助ボタンを非表示にできる', async ({ page }) => {
  await page.goto('/settings')
  await page.getByText(/入力補助ボタンを表示する/).click()
  await page.getByRole('link', { name: 'Spanish Word Quiz' }).click()
  await page.getByText('活用クイズ').click()
  await page.getByRole('button', { name: 'スタート' }).click()
  await expect(page.getByLabel('答え')).toBeVisible()
  await expect(page.getByRole('button', { name: 'ñ' })).toHaveCount(0)
})

test.describe('レスポンシブ', () => {
  /** 横スクロールが出ていないか（ページの幅が画面の幅を超えていないか） */
  async function expectNoHorizontalScroll(page: Page, where: string) {
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    )
    expect(overflow, `${where} が横にはみ出している`).toBeLessThanOrEqual(0)
  }

  for (const width of [320, 768, 1280]) {
    test(`幅 ${width}px で、どの画面も横にはみ出さない`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 })
      await page.goto('/')
      await seed(page, {
        attempts: Array.from({ length: 30 }, (_, i) => ({
          itemId: `conj:hablar:${i % 2 ? 'present' : 'preterite'}:0`,
          type: 'conj',
          correct: i % 3 !== 0,
          daysAgo: i % 14,
        })),
        tests: [
          { correct: 5, total: 10, daysAgo: 3 },
          { correct: 8, total: 10, daysAgo: 1 },
        ],
      })

      const pages = [
        '/',
        '/conjugation',
        '/vocab',
        '/cloze',
        '/cloze/manage',
        '/test',
        '/review',
        '/stats',
        '/settings',
      ]
      for (const path of pages) {
        await page.goto(path)
        await expect(page.getByRole('link', { name: 'Spanish Word Quiz' })).toBeVisible()
        await expectNoHorizontalScroll(page, path)
      }

      // 出題中の画面
      await page.goto('/conjugation')
      await page.getByRole('button', { name: 'スタート' }).click()
      await expect(page.getByLabel('答え')).toBeVisible()
      await expectNoHorizontalScroll(page, '活用クイズの出題')

      await page.goto('/test')
      await page.getByRole('button', { name: 'テストを始める' }).click()
      await expect(page.getByRole('button', { name: '採点する' })).toBeVisible()
      await expectNoHorizontalScroll(page, '総合テスト')
    })
  }
})

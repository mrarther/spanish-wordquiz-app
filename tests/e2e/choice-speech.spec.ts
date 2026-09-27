import { expect, test, type Page } from '@playwright/test'

type Spoken = { text: string; lang: string }

/** 読み上げを実際には行わず、読んだ文と言語を window.__spoken に記録する */
async function recordSpeech(page: Page) {
  await page.addInitScript(() => {
    const w = window as unknown as { __spoken: Spoken[] }
    w.__spoken = []
    window.speechSynthesis.speak = (u: SpeechSynthesisUtterance) => {
      w.__spoken.push({ text: u.text, lang: u.lang })
    }
    window.speechSynthesis.cancel = () => {}
  })
}

const spoken = (page: Page) =>
  page.evaluate(() => (window as unknown as { __spoken: Spoken[] }).__spoken)
const lastSpoken = async (page: Page) => (await spoken(page)).at(-1)

const choices = (page: Page) => page.locator('div.grid-cols-2 button')

test.describe('4択の数字キー', () => {
  test('活用クイズ：数字キーで回答でき、回答後の数字キーは無視される', async ({ page }) => {
    await page.goto('/conjugation')
    await page.getByText('4択', { exact: true }).click()
    await page.getByRole('button', { name: 'スタート' }).click()
    await expect(choices(page)).toHaveCount(4)
    await expect(choices(page).nth(0)).toHaveAttribute('aria-keyshortcuts', '1')

    await page.keyboard.press('2')
    await expect(page.getByRole('status')).toBeVisible()
    await expect(choices(page).nth(1)).toHaveClass(/border-(green|red)-600/)
    await expect(page.getByText('1 / 10', { exact: true })).toBeVisible()

    // 回答後は数字キーを押しても答えは変わらず、次の問題にも進まない
    await page.keyboard.press('3')
    await expect(page.getByText('1 / 10', { exact: true })).toBeVisible()
    await expect(choices(page).nth(2)).not.toHaveClass(/border-red-600/)

    // Enter で次の問題へ進み、また数字キーで答えられる
    await page.keyboard.press('Enter')
    await expect(page.getByRole('status')).toHaveCount(0)
    await page.keyboard.press('4')
    await expect(page.getByText('2 / 10', { exact: true })).toBeVisible()
  })

  test('総合テスト：数字キーで選び、別の数字で選び直せる', async ({ page }) => {
    await page.goto('/test')
    await page.getByText('4択', { exact: true }).click()
    await page.getByRole('button', { name: 'テストを始める' }).click()
    await expect(choices(page)).toHaveCount(4)

    await page.keyboard.press('3')
    await expect(choices(page).nth(2)).toHaveAttribute('aria-pressed', 'true')
    await page.keyboard.press('1')
    await expect(choices(page).nth(0)).toHaveAttribute('aria-pressed', 'true')
    await expect(choices(page).nth(2)).toHaveAttribute('aria-pressed', 'false')
    await expect(page.getByText(/未回答 19/)).toBeVisible()
  })

  test('入力式では、数字は入力欄に入る', async ({ page }) => {
    await page.goto('/conjugation')
    await page.getByText('入力', { exact: true }).click()
    await page.getByRole('button', { name: 'スタート' }).click()
    await page.getByLabel('答え').pressSequentially('12')
    await expect(page.getByLabel('答え')).toHaveValue('12')
    await expect(page.getByRole('status')).toHaveCount(0)
  })
})

test.describe('読み上げ', () => {
  test.beforeEach(async ({ page }) => {
    await recordSpeech(page)
  })

  test('オフ（初期値）では何も読まず、スピーカーのボタンも出ない', async ({ page }) => {
    await page.goto('/conjugation')
    await page.getByRole('button', { name: 'スタート' }).click()
    await page.getByLabel('答え').fill('xxx')
    await page.getByLabel('答え').press('Enter')
    await expect(page.getByText('不正解')).toBeVisible()
    await expect(page.getByRole('button', { name: /を読み上げる/ })).toHaveCount(0)
    expect(await spoken(page)).toEqual([])
  })

  test('画面上部のボタンでオンにすると、原形と正解・答え入りの例文が読まれる', async ({ page }) => {
    await page.goto('/')
    const toggle = page.getByRole('button', { name: '読み上げ', exact: true })
    await expect(toggle).toHaveAttribute('aria-pressed', 'false')
    await toggle.click()
    await expect(toggle).toHaveAttribute('aria-pressed', 'true')

    // 活用クイズ：表示時に原形、回答後に正解
    await page.getByText('活用クイズ').click()
    await page.getByRole('button', { name: 'スタート' }).click()
    const card = page.locator('div.rounded-lg.border').first()
    const infinitive = (await card.locator('p.text-2xl').innerText()).match(/^[a-záéíóúüñ]+/)![0]
    await expect.poll(() => lastSpoken(page)).toEqual({ text: infinitive, lang: 'es-ES' })
    await page.getByLabel('答え').fill('xxx')
    await page.getByLabel('答え').press('Enter')
    const answer = await page.getByRole('status').locator('span.font-semibold').innerText()
    await expect.poll(async () => (await lastSpoken(page))?.text).toBe(answer)

    // スピーカーのボタンでもう一度読める
    const before = (await spoken(page)).length
    await page
      .getByRole('button', { name: `「${answer}」を読み上げる` })
      .first()
      .click()
    await expect.poll(async () => (await spoken(page)).length).toBe(before + 1)

    // 例文穴埋め：回答前は読まず、回答後に答え入りの例文全体を読む
    await page.goto('/cloze')
    await page.getByRole('button', { name: 'スタート' }).click()
    await expect(page.getByLabel('答え')).toBeVisible()
    const beforeCloze = (await spoken(page)).length
    await page.getByLabel('答え').fill('xxx')
    await page.getByLabel('答え').press('Enter')
    const filled = await page.locator('span.bg-success-muted').innerText()
    await expect.poll(async () => (await spoken(page)).length).toBe(beforeCloze + 1)
    const sentence = (await lastSpoken(page))!.text
    expect(sentence).toContain(filled)
    expect(sentence).not.toContain('[[')
  })

  test('発音を中南米にすると es-MX で読み、再読み込み後も残る', async ({ page }) => {
    await page.goto('/settings')
    await page.getByText('スペイン語を読み上げる').click()
    await page.getByText('中南米の発音', { exact: true }).click()
    await page.getByRole('button', { name: '試しに聞く' }).click()
    await expect.poll(async () => (await lastSpoken(page))?.lang).toBe('es-MX')

    await expect
      .poll(() =>
        page.evaluate(
          () =>
            new Promise<unknown>((resolve) => {
              const open = indexedDB.open('spanish-wordquiz')
              open.onsuccess = () => {
                const get = open.result
                  .transaction('settings')
                  .objectStore('settings')
                  .get('appSettings')
                get.onsuccess = () => {
                  resolve(get.result?.value ?? null)
                  open.result.close()
                }
              }
            }),
        ),
      )
      .toMatchObject({ speech: true, speechLang: 'es-MX' })
    await page.reload()
    await expect(page.getByRole('checkbox', { name: '中南米の発音' })).toBeChecked()
    await expect(page.getByRole('button', { name: '読み上げ', exact: true })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })
})

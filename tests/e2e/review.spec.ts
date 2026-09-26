import { expect, test, type Page } from '@playwright/test'

/** 活用クイズの結果画面から「時制|動詞|人称 → 正解」の対応を読み取る */
async function readAnswers(page: Page) {
  const answers = new Map<string, string>()
  for (const item of await page.locator('li').all()) {
    const [label, verbLine] = await item.locator('p').allInnerTexts()
    const [tense, person] = label.split('・')
    const infinitive = verbLine.split('（')[0]
    const answer = await item.locator('span.text-green-700').innerText()
    answers.set(`${tense}|${infinitive}|${person}`, answer)
  }
  return answers
}

/** IndexedDB に保存された設定を読む（保存は非同期なので、再読み込みの前に待つために使う） */
function savedSetting(page: Page, key: string) {
  return page.evaluate(
    (k) =>
      new Promise<unknown>((resolve) => {
        const open = indexedDB.open('spanish-wordquiz')
        open.onsuccess = () => {
          const get = open.result.transaction('settings').objectStore('settings').get(k)
          get.onsuccess = () => {
            resolve(get.result?.value ?? null)
            open.result.close()
          }
        }
      }),
    key,
  )
}

/** 出題中の問題のキー（時制|動詞|人称） */
async function currentKey(page: Page) {
  await expect(page.getByLabel('答え')).toBeEditable()
  const card = page.locator('div.rounded-lg.border').first()
  const [tense, verb, person] = await card.locator('p').allInnerTexts()
  // 動詞の後ろに日本語の意味が続くので、スペイン語の部分だけ取り出す
  const infinitive = verb.match(/^[a-záéíóúüñ]+/)?.[0]
  return `${tense}|${infinitive}|${person}`
}

test('間違えた活用の問題が、10分後に復習に出て、正解すると復習から消える', async ({ page }) => {
  await page.clock.install()
  await page.goto('/')
  await page.getByText('活用クイズ').click()
  await page.getByRole('button', { name: 'スタート' }).click()

  // 10問すべて間違える
  const input = page.getByLabel('答え')
  for (let i = 0; i < 10; i++) {
    await input.fill('xxx')
    await input.press('Enter')
    await expect(page.getByText('不正解')).toBeVisible()
    await page.keyboard.press('Enter')
  }
  await expect(page.getByText('0 / 10', { exact: true })).toBeVisible()
  const answers = await readAnswers(page)
  expect(answers.size).toBe(10)

  // 直後はまだ復習対象ではない
  await page.getByRole('link', { name: 'Spanish Word Quiz' }).click()
  await page.getByText('復習', { exact: true }).click()
  const conjCard = page.locator('section', { hasText: '活用' })
  await expect(conjCard.locator('span.text-2xl')).toHaveText('0')

  // 10分以上たつと、間違えた10問が復習対象になる
  await page.clock.fastForward('11:00')
  await page.getByRole('link', { name: 'Spanish Word Quiz' }).click()
  await page.getByText('復習', { exact: true }).click()
  await expect(conjCard.locator('span.text-2xl')).toHaveText('10')

  // 復習では、間違えた問題だけが出題される。全問正解する
  await conjCard.getByRole('button', { name: '復習を始める' }).click()
  for (let i = 0; i < 10; i++) {
    const key = await currentKey(page)
    expect(answers.has(key), key).toBe(true)
    await input.fill(answers.get(key)!)
    await input.press('Enter')
    await expect(page.getByText('正解！')).toBeVisible()
    await page.keyboard.press('Enter')
  }
  await expect(page.getByText('10 / 10', { exact: true })).toBeVisible()

  // 正解した問題は翌日まで復習に出ない
  await page.getByRole('link', { name: 'Spanish Word Quiz' }).click()
  await page.getByText('復習', { exact: true }).click()
  await expect(conjCard.locator('span.text-2xl')).toHaveText('0')
})

test('設定はページを再読み込みしても残る', async ({ page }) => {
  await page.goto('/conjugation')
  await page.getByText('点過去', { exact: true }).click()
  await page.getByText('20問', { exact: true }).click()
  await expect.poll(() => savedSetting(page, 'conjugationSetup')).toMatchObject({ count: 20 })
  await page.goto('/vocab')
  await page.getByText('スペル入力', { exact: true }).click()
  await expect.poll(() => savedSetting(page, 'vocabSetup')).toMatchObject({ mode: 'spelling' })

  await page.reload()
  await expect(page.getByRole('checkbox', { name: 'スペル入力' })).toBeChecked()
  await page.goto('/conjugation')
  await expect(page.getByRole('checkbox', { name: '点過去' })).toBeChecked()
  await expect(page.getByRole('checkbox', { name: '20問' })).toBeChecked()
  await expect(page.getByRole('checkbox', { name: '10問' })).not.toBeChecked()
})

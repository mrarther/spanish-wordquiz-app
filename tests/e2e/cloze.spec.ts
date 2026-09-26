import { readFile } from 'node:fs/promises'
import { expect, test, type Page } from '@playwright/test'

async function addQuestion(page: Page, sentence: string, translation: string) {
  await page.getByRole('button', { name: '問題を追加' }).click()
  await page.getByLabel('例文').fill(sentence)
  await page.getByLabel('ヒント').fill('comer')
  await page.getByLabel('日本語訳').fill(translation)
  await page.getByText('直説法点過去', { exact: true }).click()
  await page.getByRole('button', { name: '保存' }).click()
  await expect(page.getByText('問題を追加しました')).toBeVisible()
}

test('自作の穴埋め問題を追加して解き、編集・削除できる', async ({ page }) => {
  page.on('dialog', (d) => d.accept())
  await page.goto('/')
  await page.getByText('例文穴埋め').click()
  await page.getByRole('link', { name: /自作問題の管理/ }).click()

  // 空のまま保存すると、入力の誤りが表示される
  await page.getByRole('button', { name: '問題を追加' }).click()
  await page.getByRole('button', { name: '保存' }).click()
  await expect(page.getByText('例文を入力してください')).toBeVisible()
  await expect(page.getByText('日本語訳を入力してください')).toBeVisible()

  // 空欄がないと保存できない。プレビューには空欄とヒントが表示される
  await page.getByLabel('例文').fill('Anoche yo comí tacos.')
  await expect(page.getByText(/\[\[ \]\] で囲んで/)).toBeVisible()
  await page.getByLabel('例文').fill('Anoche yo [[comí]] tacos.')
  await page.getByLabel('ヒント').fill('comer')
  await page.getByLabel('日本語訳').fill('昨夜私はタコスを食べた。')
  await page.getByLabel('別解').fill('comi')
  await page.getByText('直説法点過去', { exact: true }).click()
  await expect(page.getByText('正解：comí')).toBeVisible()
  await page.getByRole('button', { name: '保存' }).click()
  await expect(page.getByText('問題を追加しました')).toBeVisible()
  await expect(page.getByText('自作問題（1問）')).toBeVisible()

  // 自作問題のみで出題すると、追加した問題が出る
  await page.getByRole('link', { name: '穴埋めの設定へ戻る' }).click()
  await page.getByText('自作問題のみ', { exact: true }).click()
  await page.getByRole('button', { name: 'スタート' }).click()
  await expect(page.getByText('昨夜私はタコスを食べた。')).toBeVisible()
  await page.getByLabel('答え').fill('comí')
  await page.getByLabel('答え').press('Enter')
  await expect(page.getByText('正解！')).toBeVisible()
  await page.keyboard.press('Enter')
  await expect(page.getByText('1 / 1', { exact: true })).toBeVisible()

  // 編集すると一覧に反映される
  await page.goto('/cloze/manage')
  await page.getByRole('button', { name: '編集' }).click()
  await expect(page.getByLabel('例文')).toHaveValue('Anoche yo [[comí]] tacos.')
  await page.getByLabel('日本語訳').fill('昨日の夜、タコスを食べた。')
  await page.getByRole('button', { name: '保存' }).click()
  await expect(page.getByText('問題を更新しました')).toBeVisible()
  await expect(page.getByText('昨日の夜、タコスを食べた。')).toBeVisible()
  await expect(page.getByText('自作問題（1問）')).toBeVisible()

  // 削除すると一覧から消える
  await page.getByRole('button', { name: '削除' }).click()
  await expect(page.getByText('問題を削除しました')).toBeVisible()
  await expect(page.getByText('自作問題（0問）')).toBeVisible()
})

test('自作問題をエクスポートし、削除後にインポートで戻せる', async ({ page }) => {
  page.on('dialog', (d) => d.accept())
  await page.goto('/cloze/manage')
  await addQuestion(page, 'Ayer yo [[comí]] pan.', '昨日パンを食べた。')

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'エクスポート' }).click(),
  ])
  expect(download.suggestedFilename()).toMatch(/^spanish-wordquiz-cloze-\d{8}\.json$/)
  const exported = await readFile(await download.path(), 'utf8')
  expect(JSON.parse(exported).items[0]).toMatchObject({ sentence: 'Ayer yo [[comí]] pan.' })

  await page.getByRole('button', { name: '削除' }).click()
  await expect(page.getByText('自作問題（0問）')).toBeVisible()

  await page.getByLabel('インポートするファイル').setInputFiles({
    name: 'cloze.json',
    mimeType: 'application/json',
    buffer: Buffer.from(exported),
  })
  await expect(page.getByText('1件の問題を読み込みました')).toBeVisible()
  await expect(page.getByText('昨日パンを食べた。')).toBeVisible()

  // 壊れたファイルは読み込まずに理由を表示する
  await page.getByLabel('インポートするファイル').setInputFiles({
    name: 'bad.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify([{ sentence: 'sin espacio', level: 'A1' }])),
  })
  await expect(
    page.getByText('0件の問題を読み込みました（1件は読み込めませんでした）'),
  ).toBeVisible()
  await expect(page.getByText(/^1件目：/)).toBeVisible()
  await expect(page.getByText('自作問題（1問）')).toBeVisible()
})

test('組み込みの穴埋め問題を4択で解ける', async ({ page }) => {
  await page.goto('/cloze')
  await page.getByText('4択', { exact: true }).click()
  await page.getByRole('button', { name: 'スタート' }).click()
  const choices = page.locator('div.grid-cols-2 button')
  await expect(choices).toHaveCount(4)
  await choices.first().click()
  await expect(page.getByRole('status')).toBeVisible()
  // 回答後は空欄に正解が入る
  await expect(page.locator('span.bg-green-100')).toBeVisible()
})

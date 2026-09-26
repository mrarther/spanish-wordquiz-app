import { expect, test } from '@playwright/test'

// baseURL は本番ビルドのパス（…/spanish-wordquiz-app/）。page.goto には相対パスを渡す

test('インストールできる形式で、一度開けばオフラインでも使える', async ({ page, context }) => {
  await page.goto('./')
  await expect(page.getByRole('link', { name: 'Spanish Word Quiz' })).toBeVisible()

  // マニフェストとアイコン
  const manifest = await page.locator('link[rel="manifest"]').getAttribute('href')
  const res = await page.request.get(new URL(manifest!, page.url()).href)
  expect(await res.json()).toMatchObject({ name: 'Spanish Word Quiz', display: 'standalone' })

  // Service Worker がファイルをキャッシュし終えると知らせる
  await expect(page.getByText('オフラインでも使えるようになりました。')).toBeVisible()
  await page.getByRole('button', { name: '閉じる' }).click()

  // ネットワークを切っても、再読み込みや別の画面への移動ができる
  await context.setOffline(true)
  await page.reload()
  await page.getByText('語彙学習').click()
  await expect(page.getByText('語彙学習の設定')).toBeVisible()
  await page.getByRole('button', { name: 'スタート' }).click()
  await expect(page.getByText(/1 \/ 20|0 \/ 20/)).toBeVisible()

  // オフラインで URL を直接開いても表示される
  await page.goto('cloze')
  await expect(page.getByText('例文穴埋めの設定')).toBeVisible()
})

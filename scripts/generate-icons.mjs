// アプリのアイコン（favicon.svg と PWA 用の PNG）を作る。npm run icons で実行する
// PNG はインストール済みの Chrome で SVG を描画して書き出す
import { writeFile } from 'node:fs/promises'
import { chromium } from '@playwright/test'

const BLUE = '#2a78d6'
const FONT = "system-ui, -apple-system, 'Helvetica Neue', Arial, sans-serif"

/** 角丸の通常アイコン。maskable は端まで塗り、文字を安全領域（中央 80%）に収める */
function iconSvg({ maskable = false } = {}) {
  const rect = maskable
    ? `<rect width="512" height="512" fill="${BLUE}"/>`
    : `<rect width="512" height="512" rx="112" fill="${BLUE}"/>`
  const size = maskable ? 230 : 300
  const y = maskable ? 338 : 360
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">${rect}<text x="256" y="${y}" text-anchor="middle" font-family="${FONT}" font-size="${size}" font-weight="700" fill="#ffffff">Ñ</text></svg>`
}

const outputs = [
  { file: 'public/pwa-192x192.png', size: 192 },
  { file: 'public/pwa-512x512.png', size: 512 },
  { file: 'public/maskable-icon-512x512.png', size: 512, maskable: true },
  { file: 'public/apple-touch-icon.png', size: 180, maskable: true },
]

await writeFile('public/favicon.svg', iconSvg() + '\n')

const browser = await chromium.launch({ channel: 'chrome' })
const page = await browser.newPage()
for (const { file, size, maskable } of outputs) {
  const svg = iconSvg({ maskable }).replace('<svg ', `<svg width="${size}" height="${size}" `)
  await page.setViewportSize({ width: size, height: size })
  await page.setContent(`<html><body style="margin:0">${svg}</body></html>`)
  await page.screenshot({
    path: file,
    omitBackground: true,
    clip: { x: 0, y: 0, width: size, height: size },
  })
  console.log('wrote', file)
}
await browser.close()

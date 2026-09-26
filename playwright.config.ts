import { defineConfig } from '@playwright/test'

const DEV_PORT = 5173
const PREVIEW_PORT = 4173

export default defineConfig({
  testDir: 'tests/e2e',
  use: {
    // インストール済みの Chrome を使う（npx playwright install が不要）
    channel: 'chrome',
    viewport: { width: 420, height: 900 },
  },
  projects: [
    // 画面の動作は開発サーバーで確かめる
    {
      name: 'app',
      testIgnore: /pwa\.spec\.ts/,
      use: { baseURL: `http://localhost:${DEV_PORT}` },
    },
    // オフライン動作は本番ビルド（GitHub Pages と同じパス）で確かめる
    {
      name: 'pwa',
      testMatch: /pwa\.spec\.ts/,
      use: { baseURL: `http://localhost:${PREVIEW_PORT}/spanish-wordquiz-app/` },
    },
  ],
  webServer: [
    {
      command: `npm run dev -- --port ${DEV_PORT} --strictPort`,
      url: `http://localhost:${DEV_PORT}`,
      reuseExistingServer: true,
    },
    {
      command: `npm run build && npm run preview -- --port ${PREVIEW_PORT} --strictPort`,
      url: `http://localhost:${PREVIEW_PORT}/spanish-wordquiz-app/`,
      reuseExistingServer: true,
    },
  ],
})

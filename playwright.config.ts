import { defineConfig } from '@playwright/test'

const PORT = 5173

export default defineConfig({
  testDir: 'tests/e2e',
  use: {
    baseURL: `http://localhost:${PORT}`,
    // インストール済みの Chrome を使う（npx playwright install が不要）
    channel: 'chrome',
    viewport: { width: 420, height: 900 },
  },
  webServer: {
    command: `npm run dev -- --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: true,
  },
})

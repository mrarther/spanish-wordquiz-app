/// <reference types="vitest/config" />
import { copyFile } from 'node:fs/promises'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

/** GitHub Pages で公開する URL のパス（https://<ユーザー名>.github.io/spanish-wordquiz-app/） */
const PAGES_BASE = '/spanish-wordquiz-app/'

/**
 * GitHub Pages はサーバー側でルーティングできないため、index.html を 404.html としても置く。
 * /spanish-wordquiz-app/vocab のような URL を直接開いても、アプリが表示される
 */
function spaFallback(): Plugin {
  return {
    name: 'spa-fallback-404',
    apply: 'build',
    async closeBundle() {
      await copyFile('dist/index.html', 'dist/404.html')
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ command, isPreview }) => ({
  // 開発サーバー（画面の E2E テスト）はルート（/）、本番ビルドとそのプレビューは GitHub Pages のパス
  base: command === 'build' || isPreview ? PAGES_BASE : '/',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // 新しいバージョンがあるときは画面で知らせ、利用者が押したときに更新する（学習の途中で再読み込みしない）
      registerType: 'prompt',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Spanish Word Quiz',
        short_name: 'Spanish Quiz',
        description: 'スペイン語の動詞活用・語彙・例文穴埋めを学ぶアプリ',
        lang: 'ja',
        theme_color: '#2a78d6',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // アプリの全ファイルを事前にキャッシュし、オフラインでも動かす
        globPatterns: ['**/*.{js,css,html,svg,png,webmanifest}'],
      },
    }),
    spaFallback(),
  ],
  build: {
    rolldownOptions: {
      output: {
        // ライブラリ・学習データ・アプリのコードを別ファイルにする（更新時に変わった部分だけ読み直せる）
        codeSplitting: {
          groups: [
            { name: 'vendor', test: /node_modules/ },
            { name: 'data', test: /src[\\/]data[\\/].*\.json$/ },
          ],
        },
      },
    },
  },
  test: {
    include: ['src/**/*.test.ts'],
  },
}))

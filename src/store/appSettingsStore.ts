import { create } from 'zustand'

/** system：端末の設定に合わせる */
export type Theme = 'system' | 'light' | 'dark'

export type AppSettings = {
  theme: Theme
  /** 入力欄の下に á・ñ などの入力補助ボタンを表示する */
  showAccentKeyboard: boolean
}

type State = {
  settings: AppSettings
  update: (patch: Partial<AppSettings>) => void
}

export const useAppSettings = create<State>((set) => ({
  settings: { theme: 'system', showAccentKeyboard: true },
  update: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),
}))

/** index.html のスクリプトが読むキー（最初の描画の前にテーマを当てて、ちらつきを防ぐ） */
export const THEME_STORAGE_KEY = 'theme'

/** html 要素の data-theme を切り替える。system なら属性を外し、CSS の prefers-color-scheme に任せる */
export function applyTheme(theme: Theme) {
  const root = document.documentElement
  if (theme === 'system') delete root.dataset.theme
  else root.dataset.theme = theme
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch {
    // プライベートモードなどで使えなくても、IndexedDB の設定から毎回当て直すので問題ない
  }
}

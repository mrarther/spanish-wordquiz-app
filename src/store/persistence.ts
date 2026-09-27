import { VOCAB_CATEGORIES } from '../data/vocab'
import { loadSetting, saveSetting } from '../db/settings'
import { TENSES } from '../domain/conjugation/types'
import { applyTheme, useAppSettings, type AppSettings } from './appSettingsStore'
import { useClozeStore, type ClozeSetup } from './clozeStore'
import { useConjugationStore, type ConjugationSetup } from './conjugationStore'
import { useTestStore, type TestSetup } from './testStore'
import { useVocabStore, type VocabSetup } from './vocabStore'

const CONJUGATION_KEY = 'conjugationSetup'
const VOCAB_KEY = 'vocabSetup'
const CLOZE_KEY = 'clozeSetup'
const TEST_KEY = 'testSetup'
const APP_KEY = 'appSettings'

/**
 * 保存しておいた設定を読み込み、以後の設定の変更を保存する。
 * 保存時にはなかった項目は初期値のまま、今はない時制やカテゴリは取り除く
 */
export async function initPersistence() {
  try {
    const [conj, vocab, cloze, test, app] = await Promise.all([
      loadSetting<Partial<ConjugationSetup>>(CONJUGATION_KEY),
      loadSetting<Partial<VocabSetup>>(VOCAB_KEY),
      loadSetting<Partial<ClozeSetup>>(CLOZE_KEY),
      loadSetting<Partial<TestSetup>>(TEST_KEY),
      loadSetting<Partial<AppSettings>>(APP_KEY),
      useClozeStore.getState().loadCustom(),
    ])
    if (conj) {
      useConjugationStore.setState((s) => {
        const setup = { ...s.setup, ...conj }
        return { setup: { ...setup, tenses: setup.tenses.filter((t) => t in TENSES) } }
      })
    }
    const categoryIds = new Set(VOCAB_CATEGORIES.map((c) => c.id))
    if (vocab) {
      const ids = categoryIds
      useVocabStore.setState((s) => {
        const setup = { ...s.setup, ...vocab }
        return { setup: { ...setup, categories: setup.categories.filter((c) => ids.has(c)) } }
      })
    }
    if (cloze) useClozeStore.setState((s) => ({ setup: { ...s.setup, ...cloze } }))
    if (app) useAppSettings.setState((s) => ({ settings: { ...s.settings, ...app } }))
    if (test) {
      useTestStore.setState((s) => {
        const setup = { ...s.setup, ...test }
        return {
          setup: {
            ...setup,
            tenses: setup.tenses.filter((t) => t in TENSES),
            categories: setup.categories.filter((c) => categoryIds.has(c)),
          },
        }
      })
    }
  } catch (e) {
    console.error('設定の読み込みに失敗しました', e)
  }

  applyTheme(useAppSettings.getState().settings.theme)

  const save = (key: string, value: unknown) =>
    saveSetting(key, value).catch((e) => console.error('設定の保存に失敗しました', e))
  useConjugationStore.subscribe((s, prev) => {
    if (s.setup !== prev.setup) save(CONJUGATION_KEY, s.setup)
  })
  useVocabStore.subscribe((s, prev) => {
    if (s.setup !== prev.setup) save(VOCAB_KEY, s.setup)
  })
  useClozeStore.subscribe((s, prev) => {
    if (s.setup !== prev.setup) save(CLOZE_KEY, s.setup)
  })
  useTestStore.subscribe((s, prev) => {
    if (s.setup !== prev.setup) save(TEST_KEY, s.setup)
  })
  useAppSettings.subscribe((s, prev) => {
    if (s.settings === prev.settings) return
    save(APP_KEY, s.settings)
    applyTheme(s.settings.theme)
  })
}

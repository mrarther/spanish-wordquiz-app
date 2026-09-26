import { create } from 'zustand'
import { BUILTIN_CLOZE } from '../data/cloze'
import { deleteCustomCloze, listCustomCloze, putCustomCloze } from '../db/cloze'
import { getProgressMap, saveAnswer } from '../db/progress'
import { generateClozeQuiz, type ClozeQuestion } from '../domain/cloze/quiz'
import type { ClozeItem, ClozeKind } from '../domain/cloze/types'
import type { AccentMode } from '../domain/quiz/answerCheck'
import { clozeItemId } from '../domain/srs/items'
import type { Level } from '../domain/vocab/types'

export type ClozeSetup = {
  kinds: ClozeKind[]
  levels: Level[]
  /** 空ならすべてのタグ */
  tags: string[]
  customOnly: boolean
  format: 'input' | 'choice'
  accentMode: AccentMode
  count: number
  prioritizeReview: boolean
}

export type ClozeAnswer = {
  question: ClozeQuestion
  given: string
  correct: boolean
  accentMistake: boolean
}

type State = {
  setup: ClozeSetup
  questions: ClozeQuestion[]
  answers: ClozeAnswer[]
  /** IndexedDB から読み込んだ自作問題 */
  customItems: ClozeItem[]
  updateSetup: (patch: Partial<ClozeSetup>) => void
  start: (questions: ClozeQuestion[]) => void
  record: (answer: ClozeAnswer) => void
  loadCustom: () => Promise<void>
  saveCustom: (items: ClozeItem[]) => Promise<void>
  deleteCustom: (id: string) => Promise<void>
}

export const useClozeStore = create<State>((set, get) => ({
  setup: {
    kinds: ['conjugation', 'vocab'],
    levels: ['A1', 'A2', 'B1'],
    tags: [],
    customOnly: false,
    format: 'input',
    accentMode: 'lenient',
    count: 10,
    prioritizeReview: true,
  },
  questions: [],
  answers: [],
  customItems: [],
  updateSetup: (patch) => set((s) => ({ setup: { ...s.setup, ...patch } })),
  start: (questions) => set({ questions, answers: [] }),
  record: (answer) => {
    set((s) => ({ answers: [...s.answers, answer] }))
    const { correct, accentMistake } = answer
    saveAnswer({ itemId: clozeItemId(answer.question.item), type: 'cloze', correct, accentMistake })
  },
  loadCustom: async () => set({ customItems: await listCustomCloze() }),
  saveCustom: async (items) => {
    await putCustomCloze(items)
    await get().loadCustom()
  },
  deleteCustom: async (id) => {
    await deleteCustomCloze(id)
    await get().loadCustom()
  },
}))

/** 組み込みの問題と自作問題をあわせたもの */
export function allClozeItems(customItems: readonly ClozeItem[]): ClozeItem[] {
  return [...BUILTIN_CLOZE, ...customItems]
}

/** 設定に従って問題を作り、クイズを始める */
export async function startClozeQuiz(setup: ClozeSetup) {
  const srs = setup.prioritizeReview
    ? { progress: await getProgressMap('cloze'), now: Date.now() }
    : undefined
  const { customItems, start } = useClozeStore.getState()
  start(generateClozeQuiz(allClozeItems(customItems), setup, Math.random, srs))
}

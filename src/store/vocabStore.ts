import { create } from 'zustand'
import { VOCAB_CATEGORIES } from '../data/vocab'
import type { AccentMode } from '../domain/quiz/answerCheck'
import type { Direction, VocabQuestion } from '../domain/vocab/quiz'
import type { Level } from '../domain/vocab/types'

/** cards：単語カード（自己採点） / choice：4択 / spelling：意味を見てスペイン語を入力 */
export type VocabMode = 'cards' | 'choice' | 'spelling'

export type VocabSetup = {
  categories: string[]
  levels: Level[]
  mode: VocabMode
  /** spelling では常に ja-es */
  direction: Direction
  count: number
  accentMode: AccentMode
}

export type VocabAnswer = {
  question: VocabQuestion
  /** 単語カードでは空文字 */
  given: string
  correct: boolean
  accentMistake: boolean
}

type State = {
  setup: VocabSetup
  questions: VocabQuestion[]
  answers: VocabAnswer[]
  updateSetup: (patch: Partial<VocabSetup>) => void
  start: (questions: VocabQuestion[]) => void
  record: (answer: VocabAnswer) => void
}

export const useVocabStore = create<State>((set) => ({
  setup: {
    categories: VOCAB_CATEGORIES.map((c) => c.id),
    levels: ['A1', 'A2'],
    mode: 'choice',
    direction: 'es-ja',
    count: 20,
    accentMode: 'lenient',
  },
  questions: [],
  answers: [],
  updateSetup: (patch) => set((s) => ({ setup: { ...s.setup, ...patch } })),
  start: (questions) => set({ questions, answers: [] }),
  record: (answer) => set((s) => ({ answers: [...s.answers, answer] })),
}))

export function vocabDirection(setup: VocabSetup): Direction {
  return setup.mode === 'spelling' ? 'ja-es' : setup.direction
}

export function vocabQuizPath(mode: VocabMode): string {
  return mode === 'cards' ? '/vocab/cards' : '/vocab/quiz'
}

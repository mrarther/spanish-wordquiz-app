import { create } from 'zustand'
import type { Tense, VerbEntry } from '../domain/conjugation/types'
import type { AccentMode } from '../domain/quiz/answerCheck'
import type { ConjugationQuestion } from '../domain/quiz/generator'

export type AnswerFormat = 'input' | 'choice'

export type ConjugationSetup = {
  tenses: Tense[]
  groups: VerbEntry['group'][]
  includeVosotros: boolean
  count: number
  format: AnswerFormat
  accentMode: AccentMode
}

export type AnswerRecord = {
  question: ConjugationQuestion
  given: string
  correct: boolean
  accentMistake: boolean
}

type State = {
  setup: ConjugationSetup
  questions: ConjugationQuestion[]
  answers: AnswerRecord[]
  updateSetup: (patch: Partial<ConjugationSetup>) => void
  start: (questions: ConjugationQuestion[]) => void
  record: (answer: AnswerRecord) => void
}

export const useConjugationStore = create<State>((set) => ({
  setup: {
    tenses: ['present'],
    groups: ['regular', 'stem', 'irregular'],
    includeVosotros: true,
    count: 10,
    format: 'input',
    accentMode: 'lenient',
  },
  questions: [],
  answers: [],
  updateSetup: (patch) => set((s) => ({ setup: { ...s.setup, ...patch } })),
  start: (questions) => set({ questions, answers: [] }),
  record: (answer) => set((s) => ({ answers: [...s.answers, answer] })),
}))

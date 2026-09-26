import { create } from 'zustand'
import type { Tense, VerbEntry } from '../domain/conjugation/types'
import type { AccentMode } from '../domain/quiz/answerCheck'
import { VERBS } from '../data/verbs'
import { getProgressMap, saveAnswer } from '../db/progress'
import { generateConjugationQuiz, type ConjugationQuestion } from '../domain/quiz/generator'
import { conjItemId } from '../domain/srs/items'

export type AnswerFormat = 'input' | 'choice'

export type ConjugationSetup = {
  tenses: Tense[]
  groups: VerbEntry['group'][]
  includeVosotros: boolean
  count: number
  format: AnswerFormat
  accentMode: AccentMode
  /** 復習時期が来た問題・未出題の問題を優先する */
  prioritizeReview: boolean
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
    prioritizeReview: true,
  },
  questions: [],
  answers: [],
  updateSetup: (patch) => set((s) => ({ setup: { ...s.setup, ...patch } })),
  start: (questions) => set({ questions, answers: [] }),
  record: (answer) => {
    set((s) => ({ answers: [...s.answers, answer] }))
    const { correct, accentMistake } = answer
    saveAnswer({ itemId: conjItemId(answer.question), type: 'conj', correct, accentMistake })
  },
}))

/** 設定に従って問題を作り、クイズを始める */
export async function startConjugationQuiz(setup: ConjugationSetup) {
  const srs = setup.prioritizeReview
    ? { progress: await getProgressMap('conj'), now: Date.now() }
    : undefined
  useConjugationStore.getState().start(generateConjugationQuiz(VERBS, setup, Math.random, srs))
}

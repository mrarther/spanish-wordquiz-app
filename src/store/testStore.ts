import { create } from 'zustand'
import { VERBS } from '../data/verbs'
import { VOCAB, VOCAB_CATEGORIES } from '../data/vocab'
import { saveAnswer } from '../db/progress'
import { addTestResult } from '../db/testResults'
import { clozeChoices } from '../domain/cloze/quiz'
import type { AccentMode } from '../domain/quiz/answerCheck'
import { conjugationChoices } from '../domain/quiz/distractors'
import type { ItemType } from '../domain/srs/items'
import { composeTest, type TestQuestion, type TestRange } from '../domain/test/compose'
import { scoreTest, type TestScore } from '../domain/test/score'
import { vocabChoices } from '../domain/vocab/quiz'
import { allClozeItems, useClozeStore } from './clozeStore'

export type TestSetup = TestRange & {
  count: number
  /** 制限時間（分）。null なら制限なし */
  timeLimitMin: number | null
  format: 'input' | 'choice'
  accentMode: AccentMode
}

type State = {
  setup: TestSetup
  questions: TestQuestion[]
  /** 4択のとき、問題 id ごとの選択肢（前後の問題に移動しても並びが変わらないよう、開始時に作る） */
  choices: Record<string, string[]>
  answers: Record<string, string>
  startedAt: number
  deadline: number | null
  /** 採点した時刻 */
  finishedAt: number
  score: TestScore | null
  timedOut: boolean
  updateSetup: (patch: Partial<TestSetup>) => void
  start: (questions: TestQuestion[], choices: Record<string, string[]>, now: number) => void
  answer: (id: string, given: string) => void
  finish: (opts: { timedOut: boolean; now: number }) => Promise<void>
}

const SRS_TYPE: Record<TestQuestion['section'], ItemType> = {
  conj: 'conj',
  vocab: 'vocab',
  cloze: 'cloze',
}

export const useTestStore = create<State>((set, get) => ({
  setup: {
    sections: ['conj', 'vocab', 'cloze'],
    tenses: ['present', 'preterite', 'imperfect', 'future'],
    levels: ['A1', 'A2'],
    categories: VOCAB_CATEGORIES.map((c) => c.id),
    includeVosotros: true,
    includeCustom: true,
    count: 20,
    timeLimitMin: 10,
    format: 'input',
    accentMode: 'lenient',
  },
  questions: [],
  choices: {},
  answers: {},
  startedAt: 0,
  deadline: null,
  finishedAt: 0,
  score: null,
  timedOut: false,
  updateSetup: (patch) => set((s) => ({ setup: { ...s.setup, ...patch } })),
  start: (questions, choices, now) => {
    const { timeLimitMin } = get().setup
    set({
      questions,
      choices,
      answers: {},
      startedAt: now,
      deadline: timeLimitMin ? now + timeLimitMin * 60 * 1000 : null,
      score: null,
      timedOut: false,
    })
  },
  answer: (id, given) => set((s) => ({ answers: { ...s.answers, [id]: given } })),
  /** 採点して結果を保存する。時間切れと採点ボタンが重なっても1回だけ採点する */
  finish: async ({ timedOut, now }) => {
    const { questions, answers, setup, startedAt, score: already } = get()
    if (already) return
    const mode = setup.format === 'choice' ? 'strict' : setup.accentMode
    const score = scoreTest(questions, answers, mode)
    set({ score, timedOut, finishedAt: now })

    for (const r of score.results) {
      if (!r.answered) continue
      const { correct, accentMistake } = r
      saveAnswer({
        itemId: r.question.id,
        type: SRS_TYPE[r.question.section],
        correct,
        accentMistake,
      })
    }
    await addTestResult({
      at: now,
      durationMs: now - startedAt,
      timeLimitMin: setup.timeLimitMin,
      timedOut,
      format: setup.format,
      range: rangeOf(setup),
      total: score.total,
      correct: score.correct,
      bySection: score.bySection,
      wrongItemIds: score.results.filter((r) => !r.correct).map((r) => r.question.id),
    }).catch((e) => console.error('テスト結果の保存に失敗しました', e))
  },
}))

/** 設定のうち出題範囲の部分 */
export function rangeOf(s: TestSetup): TestRange {
  const { sections, tenses, levels, categories, includeVosotros, includeCustom } = s
  return { sections, tenses, levels, categories, includeVosotros, includeCustom }
}

function choicesFor(q: TestQuestion): string[] {
  switch (q.section) {
    case 'conj':
      return conjugationChoices(q.conj)
    case 'vocab':
      return vocabChoices(q.vocab, VOCAB)
    case 'cloze':
      return clozeChoices(q.cloze, allClozeItems(useClozeStore.getState().customItems), {
        verbs: VERBS,
        vocab: VOCAB,
      })
  }
}

export function testData() {
  return { verbs: VERBS, vocab: VOCAB, cloze: allClozeItems(useClozeStore.getState().customItems) }
}

/** 範囲に従って問題を作り、テストを始める */
export function startTest(setup: TestSetup, now = Date.now()) {
  const questions = composeTest(rangeOf(setup), setup.count, testData())
  const choices =
    setup.format === 'choice' ? Object.fromEntries(questions.map((q) => [q.id, choicesFor(q)])) : {}
  useTestStore.getState().start(questions, choices, now)
}

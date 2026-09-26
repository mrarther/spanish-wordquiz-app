import { checkAnswer, type AccentMode } from '../quiz/answerCheck'
import { TEST_SECTIONS, type TestQuestion, type TestSection } from './compose'

export type TestAnswerResult = {
  question: TestQuestion
  given: string
  answered: boolean
  correct: boolean
  accentMistake: boolean
}

export type SectionScore = { total: number; correct: number }

export type TestScore = {
  total: number
  correct: number
  bySection: Record<TestSection, SectionScore>
  results: TestAnswerResult[]
}

/** まとめて採点する。未回答は不正解 */
export function scoreTest(
  questions: readonly TestQuestion[],
  answers: Readonly<Record<string, string>>,
  mode: AccentMode,
): TestScore {
  const bySection = Object.fromEntries(
    TEST_SECTIONS.map((s) => [s, { total: 0, correct: 0 }]),
  ) as Record<TestSection, SectionScore>

  const results = questions.map((question): TestAnswerResult => {
    const given = answers[question.id] ?? ''
    const answered = given.trim() !== ''
    const r = answered
      ? checkAnswer(given, question.accepted, mode)
      : { correct: false, accentMistake: false }
    bySection[question.section].total++
    if (r.correct) bySection[question.section].correct++
    return { question, given, answered, ...r }
  })

  return {
    total: questions.length,
    correct: results.filter((r) => r.correct).length,
    bySection,
    results,
  }
}

/** 正答率（%、四捨五入）。問題がなければ 0 */
export function percent({ total, correct }: SectionScore): number {
  return total === 0 ? 0 : Math.round((correct / total) * 100)
}

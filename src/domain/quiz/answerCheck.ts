import { stripAccents } from '../conjugation/regular'

/** strict：アクセント記号まで一致が必要 / lenient：アクセント記号の違いは正解にする（ñ・ü は区別する） */
export type AccentMode = 'strict' | 'lenient'

export type CheckResult = {
  correct: boolean
  /** アクセント記号だけが違っていた */
  accentMistake: boolean
}

export function normalize(s: string): string {
  return s.normalize('NFC').trim().toLowerCase().replace(/\s+/g, ' ')
}

export function checkAnswer(
  input: string,
  accepted: readonly string[],
  mode: AccentMode,
): CheckResult {
  const given = normalize(input)
  const answers = accepted.map(normalize)
  if (answers.includes(given)) return { correct: true, accentMistake: false }
  const loose = stripAccents(given)
  const accentMistake = given !== '' && answers.some((a) => stripAccents(a) === loose)
  return { correct: accentMistake && mode === 'lenient', accentMistake }
}

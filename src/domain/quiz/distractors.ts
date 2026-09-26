import { conjugateAll } from '../conjugation/conjugate'
import { TENSES, type Tense } from '../conjugation/types'
import { shuffle, type Rng } from '../../utils/random'
import { normalize } from './answerCheck'
import type { ConjugationQuestion } from './generator'

const ALL_TENSES = Object.keys(TENSES) as Tense[]

/**
 * 4択の選択肢（正解を含む、並びはランダム）を返す。
 * 誤答は紛らわしい順に選ぶ：同じ時制の別の人称 → 同じ人称の同じ法の別時制 → 同じ人称の全時制
 */
export function conjugationChoices(
  q: ConjugationQuestion,
  rng: Rng = Math.random,
  n = 4,
): string[] {
  const seen = new Set([normalize(q.answer)])
  const wrong: string[] = []
  const add = (forms: (string | null | undefined)[]) => {
    for (const form of shuffle(forms, rng)) {
      if (wrong.length >= n - 1) return
      if (!form || seen.has(normalize(form))) continue
      seen.add(normalize(form))
      wrong.push(form)
    }
  }

  const mood = TENSES[q.tense].mood
  add(conjugateAll(q.verb, q.tense))
  add(
    ALL_TENSES.filter((t) => TENSES[t].mood === mood).map((t) => conjugateAll(q.verb, t)[q.person]),
  )
  add(ALL_TENSES.map((t) => conjugateAll(q.verb, t)[q.person]))

  return shuffle([q.answer, ...wrong], rng)
}

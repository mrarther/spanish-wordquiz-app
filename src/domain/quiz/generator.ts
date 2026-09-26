import { conjugateAll } from '../conjugation/conjugate'
import { PERSONS, type Person, type Tense, type VerbEntry } from '../conjugation/types'
import { sample, type Rng } from '../../utils/random'
import { conjItemId } from '../srs/items'
import { prioritize, type DueInfo } from '../srs/select'

export type ConjugationQuizOptions = {
  tenses: readonly Tense[]
  groups: readonly VerbEntry['group'][]
  includeVosotros: boolean
  count: number
}

export type ConjugationQuestion = {
  id: string
  verb: VerbEntry
  tense: Tense
  person: Person
  /** 正解として表示する形 */
  answer: string
  /** 正解として受け付ける入力（命令法の否定は "no" があってもなくてもよい） */
  accepted: string[]
}

export function makeQuestion(
  verb: VerbEntry,
  tense: Tense,
  person: Person,
): ConjugationQuestion | null {
  const answer = conjugateAll(verb, tense)[person]
  if (!answer) return null
  const accepted = tense === 'imperativeNegative' ? [answer, `no ${answer}`] : [answer]
  return { id: `${verb.infinitive}:${tense}:${person}`, verb, tense, person, answer, accepted }
}

/** 条件に合う全ての（動詞・時制・人称）の組み合わせ */
export function buildConjugationPool(
  verbs: readonly VerbEntry[],
  opts: Omit<ConjugationQuizOptions, 'count'>,
): ConjugationQuestion[] {
  const persons = PERSONS.filter((p) => opts.includeVosotros || p !== 4)
  const pool: ConjugationQuestion[] = []
  for (const verb of verbs) {
    if (!opts.groups.includes(verb.group)) continue
    for (const tense of opts.tenses) {
      for (const person of persons) {
        const q = makeQuestion(verb, tense, person)
        if (q) pool.push(q)
      }
    }
  }
  return pool
}

/** SRS で優先度を付けるときに渡す、項目 id ごとの復習時期 */
export type SrsOption = { progress: ReadonlyMap<string, DueInfo>; now: number }

/**
 * 重複なしで count 問を選ぶ。条件に合う問題が少ない場合は、あるだけ返す。
 * srs を渡すと、復習時期が来た問題 → 未出題 → それ以外の順に選ぶ
 */
export function generateConjugationQuiz(
  verbs: readonly VerbEntry[],
  opts: ConjugationQuizOptions,
  rng: Rng = Math.random,
  srs?: SrsOption,
): ConjugationQuestion[] {
  const pool = buildConjugationPool(verbs, opts)
  if (!srs) return sample(pool, opts.count, rng)
  return prioritize(pool, conjItemId, srs.progress, opts.count, srs.now, rng)
}

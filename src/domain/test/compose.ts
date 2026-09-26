import { sample, shuffle, type Rng } from '../../utils/random'
import { makeClozeQuestion, type ClozeQuestion } from '../cloze/quiz'
import type { ClozeItem } from '../cloze/types'
import { TENSES, type Tense, type VerbEntry } from '../conjugation/types'
import { buildConjugationPool, type ConjugationQuestion } from '../quiz/generator'
import { clozeItemId, conjItemId, vocabItemId } from '../srs/items'
import { filterVocab, makeVocabQuestion, type VocabQuestion } from '../vocab/quiz'
import type { Level, VocabWord } from '../vocab/types'

export type TestSection = 'conj' | 'vocab' | 'cloze'

export const TEST_SECTIONS: TestSection[] = ['conj', 'vocab', 'cloze']

export const SECTION_LABELS: Record<TestSection, string> = {
  conj: '活用',
  vocab: '語彙',
  cloze: '例文穴埋め',
}

/** 出題範囲 */
export type TestRange = {
  sections: TestSection[]
  /** 活用と、活用の穴埋め問題の範囲 */
  tenses: Tense[]
  /** 語彙と穴埋め問題の範囲（活用問題にはレベルがない） */
  levels: Level[]
  /** 語彙と、語彙の穴埋め問題の範囲 */
  categories: string[]
  includeVosotros: boolean
  /** 自作の穴埋め問題を含める（自作問題はタグに関係なく、レベルだけで絞り込む） */
  includeCustom: boolean
}

/** id は SRS の項目 id（conj:… / vocab:… / cloze:…）なので、分野をまたいでも重ならない */
export type TestQuestion =
  | { section: 'conj'; id: string; answer: string; accepted: string[]; conj: ConjugationQuestion }
  | { section: 'vocab'; id: string; answer: string; accepted: string[]; vocab: VocabQuestion }
  | { section: 'cloze'; id: string; answer: string; accepted: string[]; cloze: ClozeQuestion }

export type TestData = {
  verbs: readonly VerbEntry[]
  vocab: readonly VocabWord[]
  /** 組み込み＋自作の穴埋め問題 */
  cloze: readonly ClozeItem[]
}

/** 分野ごとの出題候補 */
export function buildTestPools(
  range: TestRange,
  data: TestData,
): Record<TestSection, TestQuestion[]> {
  const conj: TestQuestion[] = buildConjugationPool(data.verbs, {
    tenses: range.tenses,
    groups: ['regular', 'stem', 'irregular'],
    includeVosotros: range.includeVosotros,
  }).map((q) => ({
    section: 'conj',
    id: conjItemId(q),
    answer: q.answer,
    accepted: q.accepted,
    conj: q,
  }))

  const vocab: TestQuestion[] = filterVocab(data.vocab, range).map((w) => {
    const q = makeVocabQuestion(w, 'ja-es', data.vocab)
    return {
      section: 'vocab',
      id: vocabItemId(w),
      answer: q.answer,
      accepted: q.accepted,
      vocab: q,
    }
  })

  const inRange = (item: ClozeItem) => {
    if (!range.levels.includes(item.level)) return false
    if (item.source === 'custom') return range.includeCustom
    const allowed: readonly string[] = item.kind === 'conjugation' ? range.tenses : range.categories
    return item.tags.some((t) => allowed.includes(t))
  }
  const cloze: TestQuestion[] = data.cloze.filter(inRange).flatMap((item) => {
    const q = makeClozeQuestion(item)
    return q
      ? [
          {
            section: 'cloze' as const,
            id: clozeItemId(item),
            answer: q.answer,
            accepted: q.accepted,
            cloze: q,
          },
        ]
      : []
  })

  return { conj, vocab, cloze }
}

/**
 * count 問を、選んだ分野に均等に割り振る（割り切れない分は分野の並び順に1問ずつ）。
 * 候補が足りない分野の不足分は、ほかの分野に回す
 */
export function allocate(
  count: number,
  sections: readonly TestSection[],
  available: Record<TestSection, number>,
): Record<TestSection, number> {
  const result: Record<TestSection, number> = { conj: 0, vocab: 0, cloze: 0 }
  let remaining = TEST_SECTIONS.filter((s) => sections.includes(s) && available[s] > 0)
  let rest = Math.min(
    count,
    remaining.reduce((sum, s) => sum + available[s], 0),
  )
  // 均等な取り分より候補が少ない分野には候補をすべて割り当て、残りを残りの分野で分け直す
  while (remaining.length > 0) {
    const fair = rest / remaining.length
    const small = remaining.filter((s) => available[s] <= fair)
    if (small.length === 0) break
    for (const s of small) {
      result[s] = available[s]
      rest -= available[s]
    }
    remaining = remaining.filter((s) => !small.includes(s))
  }
  const share = Math.floor(rest / Math.max(remaining.length, 1))
  remaining.forEach((s, i) => {
    result[s] = share + (i < rest % remaining.length ? 1 : 0)
  })
  return result
}

export function composeTest(
  range: TestRange,
  count: number,
  data: TestData,
  rng: Rng = Math.random,
): TestQuestion[] {
  const pools = buildTestPools(range, data)
  const sizes = { conj: pools.conj.length, vocab: pools.vocab.length, cloze: pools.cloze.length }
  const counts = allocate(count, range.sections, sizes)
  return shuffle(
    TEST_SECTIONS.flatMap((s) => sample(pools[s], counts[s], rng)),
    rng,
  )
}

/** 範囲の初期値に使う、すべての時制 */
export const ALL_TENSES = Object.keys(TENSES) as Tense[]

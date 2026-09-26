import { sample, shuffle, type Rng } from '../../utils/random'
import { conjugateAll } from '../conjugation/conjugate'
import { TENSES, type Tense, type VerbEntry } from '../conjugation/types'
import { normalize } from '../quiz/answerCheck'
import type { SrsOption } from '../quiz/generator'
import { clozeItemId } from '../srs/items'
import { prioritize } from '../srs/select'
import type { Level, VocabWord } from '../vocab/types'
import { parseCloze, type ParsedCloze } from './parse'
import type { ClozeItem, ClozeKind } from './types'

export type ClozeFilter = {
  kinds: readonly ClozeKind[]
  levels: readonly Level[]
  /** 空ならすべて。指定したタグのどれかを持つ問題を出す */
  tags: readonly string[]
  customOnly: boolean
}

export type ClozeQuestion = {
  id: string
  item: ClozeItem
  parsed: ParsedCloze
  answer: string
  accepted: string[]
}

export function filterCloze(items: readonly ClozeItem[], f: ClozeFilter): ClozeItem[] {
  return items.filter(
    (item) =>
      f.kinds.includes(item.kind) &&
      f.levels.includes(item.level) &&
      (f.tags.length === 0 || item.tags.some((t) => f.tags.includes(t))) &&
      (!f.customOnly || item.source === 'custom'),
  )
}

/** 例文が壊れていて空欄を取り出せない問題は null */
export function makeClozeQuestion(item: ClozeItem): ClozeQuestion | null {
  const parsed = parseCloze(item.sentence)
  if (!parsed) return null
  return {
    id: item.id,
    item,
    parsed,
    answer: parsed.answer,
    accepted: [parsed.answer, ...(item.alternatives ?? [])],
  }
}

/** srs を渡すと、復習時期が来た問題 → 未出題 → それ以外の順に選ぶ */
export function generateClozeQuiz(
  items: readonly ClozeItem[],
  opts: ClozeFilter & { count: number },
  rng: Rng = Math.random,
  srs?: SrsOption,
): ClozeQuestion[] {
  const pool = filterCloze(items, opts)
  const picked = srs
    ? prioritize(pool, clozeItemId, srs.progress, opts.count, srs.now, rng)
    : sample(pool, opts.count, rng)
  return picked.flatMap((item) => makeClozeQuestion(item) ?? [])
}

const SIMPLE_TENSES = (Object.keys(TENSES) as Tense[]).filter((t) => !t.endsWith('erfect'))

/** 答えの大文字・小文字を問題の答えに合わせる（文頭の空欄なら先頭を大文字に） */
function matchCase(form: string, answer: string): string {
  const upper = answer[0] !== undefined && answer[0] !== answer[0].toLowerCase()
  return upper ? form[0].toUpperCase() + form.slice(1) : form
}

/**
 * 4択の選択肢（正解を含む、並びはランダム）。誤答の候補は次の順に選ぶ。
 * - 活用：ヒントの動詞の、同じ時制の別の人称 → ほかの時制の形
 * - 語彙：答えと同じ品詞・カテゴリの単語 → 同じ品詞の単語
 * - どちらも足りなければ、同じ種類のほかの問題の答え → すべての問題の答え
 */
export function clozeChoices(
  q: ClozeQuestion,
  pool: readonly ClozeItem[],
  data: { verbs: readonly VerbEntry[]; vocab: readonly VocabWord[] },
  rng: Rng = Math.random,
  n = 4,
): string[] {
  const seen = new Set(q.accepted.map(normalize))
  const wrong: string[] = []
  const add = (candidates: (string | null | undefined)[]) => {
    for (const c of shuffle(candidates, rng)) {
      if (wrong.length >= n - 1) return
      if (!c) continue
      const text = matchCase(c, q.answer)
      if (seen.has(normalize(text))) continue
      seen.add(normalize(text))
      wrong.push(text)
    }
  }

  const { item } = q
  if (item.kind === 'conjugation') {
    const verb = data.verbs.find((v) => v.infinitive === item.hint?.toLowerCase())
    if (verb) {
      const tenses = item.tags.filter((t): t is Tense => t in TENSES)
      tenses.forEach((t) => add(conjugateAll(verb, t)))
      SIMPLE_TENSES.forEach((t) => add(conjugateAll(verb, t)))
    }
  } else {
    const word = data.vocab.find((w) => w.es === q.answer.toLowerCase())
    if (word) {
      const samePos = data.vocab.filter((w) => w.pos === word.pos)
      add(samePos.filter((w) => w.category === word.category).map((w) => w.es))
      add(samePos.map((w) => w.es))
    }
  }
  const answers = (items: readonly ClozeItem[]) => items.map((i) => parseCloze(i.sentence)?.answer)
  add(answers(pool.filter((i) => i.kind === item.kind)))
  add(answers(pool))

  return shuffle([q.answer, ...wrong], rng)
}

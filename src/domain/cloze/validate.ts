import { normalize } from '../quiz/answerCheck'
import type { Level } from '../vocab/types'
import { countBlanks, hasStrayBrackets, parseCloze } from './parse'
import { CLOZE_KINDS, type ClozeKind } from './types'

export const LEVELS: Level[] = ['A1', 'A2', 'B1', 'B2']

export const LIMITS = { sentence: 300, translation: 300, hint: 50, alternative: 50, tag: 30 }

/** フォームやインポートから受け取る、まだ検査していない問題 */
export type ClozeDraft = {
  sentence: string
  translation_ja: string
  hint?: string
  alternatives?: string[]
  kind: string
  tags?: string[]
  level: string
}

export type ClozeErrors = Partial<
  Record<
    'sentence' | 'translation_ja' | 'hint' | 'alternatives' | 'kind' | 'tags' | 'level',
    string
  >
>

/** 前後の空白を除き、空の別解・タグと重複を取り除く。別解から正解と同じものも除く */
export function cleanDraft(d: ClozeDraft): ClozeDraft {
  const list = (xs: string[] | undefined) => [
    ...new Set((xs ?? []).map((x) => x.trim()).filter(Boolean)),
  ]
  const answer = parseCloze(d.sentence.trim())?.answer
  const hint = d.hint?.trim()
  return {
    sentence: d.sentence.trim(),
    translation_ja: d.translation_ja.trim(),
    hint: hint || undefined,
    alternatives: list(d.alternatives).filter(
      (a) => answer === undefined || normalize(a) !== normalize(answer),
    ),
    kind: d.kind,
    tags: list(d.tags),
    level: d.level,
  }
}

/** 入力の誤りを項目ごとに返す。誤りがなければ空のオブジェクト */
export function validateCloze(draft: ClozeDraft): ClozeErrors {
  const d = cleanDraft(draft)
  const errors: ClozeErrors = {}

  const blanks = countBlanks(d.sentence)
  if (!d.sentence) errors.sentence = '例文を入力してください'
  else if (d.sentence.length > LIMITS.sentence)
    errors.sentence = `例文は${LIMITS.sentence}文字以内にしてください`
  else if (hasStrayBrackets(d.sentence)) errors.sentence = '[[ と ]] の組み合わせが正しくありません'
  else if (blanks === 0)
    errors.sentence = '空欄にする答えを [[ ]] で囲んでください（例：Ayer yo [[comí]] paella.）'
  else if (blanks > 1) errors.sentence = '空欄（[[ ]]）は1つだけにしてください'
  else if (!parseCloze(d.sentence)) errors.sentence = '[[ ]] の中に答えを書いてください'

  if (!d.translation_ja) errors.translation_ja = '日本語訳を入力してください'
  else if (d.translation_ja.length > LIMITS.translation)
    errors.translation_ja = `日本語訳は${LIMITS.translation}文字以内にしてください`

  if (d.hint && d.hint.length > LIMITS.hint)
    errors.hint = `ヒントは${LIMITS.hint}文字以内にしてください`
  if (d.alternatives?.some((a) => a.length > LIMITS.alternative))
    errors.alternatives = `別解は1つ${LIMITS.alternative}文字以内にしてください`
  if (d.tags?.some((t) => t.length > LIMITS.tag))
    errors.tags = `タグは1つ${LIMITS.tag}文字以内にしてください`
  if (!CLOZE_KINDS.includes(d.kind as ClozeKind)) errors.kind = '種類を選んでください'
  if (!LEVELS.includes(d.level as Level)) errors.level = 'レベルを選んでください'
  return errors
}

export function isValid(errors: ClozeErrors): boolean {
  return Object.keys(errors).length === 0
}

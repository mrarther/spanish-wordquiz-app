import type { Level } from '../vocab/types'

/** conjugation：動詞の活用を入れる / vocab：単語を入れる */
export type ClozeKind = 'conjugation' | 'vocab'

export const CLOZE_KINDS: ClozeKind[] = ['conjugation', 'vocab']

export const CLOZE_KIND_LABELS: Record<ClozeKind, string> = {
  conjugation: '活用',
  vocab: '語彙',
}

export type ClozeItem = {
  id: string
  /** 空欄の答えを [[ ]] で囲んだ例文（"Ayer yo [[comí]] paella."）。空欄はちょうど1つ */
  sentence: string
  translation_ja: string
  /** 空欄の横に表示するヒント（活用なら動詞の原形、語彙なら意味） */
  hint?: string
  /** 正解として受け付ける別の答え */
  alternatives?: string[]
  kind: ClozeKind
  /** 活用なら時制 id（present など）、語彙ならカテゴリ id（food など） */
  tags: string[]
  level: Level
  source: 'builtin' | 'custom'
  updatedAt?: number
}

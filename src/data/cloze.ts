import { TENSES, type Tense } from '../domain/conjugation/types'
import type { ClozeItem } from '../domain/cloze/types'
import { VOCAB_CATEGORIES } from './vocab'
import raw from './cloze.json'

/** 最初から入っている穴埋め問題（id は b001 から） */
export const BUILTIN_CLOZE: ClozeItem[] = (raw as Omit<ClozeItem, 'source'>[]).map((item) => ({
  ...item,
  source: 'builtin',
}))

/** タグの表示名：時制 id → 時制名、カテゴリ id → カテゴリ名、それ以外はそのまま */
export function clozeTagLabel(tag: string): string {
  if (tag in TENSES) return TENSES[tag as Tense].label_ja
  return VOCAB_CATEGORIES.find((c) => c.id === tag)?.label_ja ?? tag
}

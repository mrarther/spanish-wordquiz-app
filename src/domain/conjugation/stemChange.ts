import type { StemChange } from './types'

/** 強勢のある音節での変化（pensar → piens-） */
const LONG: Record<StemChange, [string, string]> = {
  'e>ie': ['e', 'ie'],
  'o>ue': ['o', 'ue'],
  'e>i': ['e', 'i'],
  'u>ue': ['u', 'ue'],
  'i>í': ['i', 'í'],
  'u>ú': ['u', 'ú'],
}

/** -ir 動詞だけに起こる弱い変化（durmió, pidiendo, sintamos） */
const SHORT: Partial<Record<StemChange, [string, string]>> = {
  'e>ie': ['e', 'i'],
  'o>ue': ['o', 'u'],
  'e>i': ['e', 'i'],
}

/** 語幹の最後に現れる母音を置き換える */
function replaceLast(stem: string, [from, to]: [string, string]): string {
  const i = stem.lastIndexOf(from)
  return i < 0 ? stem : stem.slice(0, i) + to + stem.slice(i + from.length)
}

export function longStem(stem: string, change?: StemChange): string {
  return change ? replaceLast(stem, LONG[change]) : stem
}

export function shortStem(stem: string, change?: StemChange): string {
  const rule = change && SHORT[change]
  return rule ? replaceLast(stem, rule) : stem
}

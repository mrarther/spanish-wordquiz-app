import type { TestQuestion } from './compose'

export function isNegativeImperative(q: TestQuestion): boolean {
  return q.section === 'conj' && q.conj.tense === 'imperativeNegative'
}

/** 命令法の否定は "no" を付けて表示する */
export function displayAnswer(q: TestQuestion, text: string): string {
  return isNegativeImperative(q) ? `no ${text}` : text
}

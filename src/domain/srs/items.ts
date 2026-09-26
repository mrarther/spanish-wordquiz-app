import type { ConjugationQuestion } from '../quiz/generator'
import type { VocabWord } from '../vocab/types'

/** 進捗を記録する項目の種類 */
export type ItemType = 'conj' | 'vocab' | 'cloze'

/** 活用は（動詞・時制・人称）ごとに記録する：conj:hablar:present:0 */
export function conjItemId(q: Pick<ConjugationQuestion, 'id'>): string {
  return `conj:${q.id}`
}

/** 語彙は出題の向きに関係なく単語ごとに記録する：vocab:food:agua */
export function vocabItemId(word: Pick<VocabWord, 'id'>): string {
  return `vocab:${word.id}`
}

/** conj:hablar:present:0 → { infinitive, tense, person } */
export function parseConjItemId(itemId: string) {
  const [type, infinitive, tense, person] = itemId.split(':')
  if (type !== 'conj' || !infinitive || !tense || person === undefined) return null
  return { infinitive, tense, person: Number(person) }
}

/** vocab:food:agua → food:agua（単語の id） */
export function parseVocabItemId(itemId: string): string | null {
  return itemId.startsWith('vocab:') ? itemId.slice('vocab:'.length) : null
}

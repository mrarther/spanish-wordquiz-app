import { TENSES, type Person, type Tense, type VerbEntry } from '../conjugation/types'
import { makeQuestion, type ConjugationQuestion } from '../quiz/generator'
import type { VocabWord } from '../vocab/types'
import { parseConjItemId, parseVocabItemId } from './items'

/** 復習する項目 id から活用の問題を作る。データから消えた動詞などは飛ばす */
export function conjQuestionsFromItems(
  itemIds: readonly string[],
  verbs: readonly VerbEntry[],
): ConjugationQuestion[] {
  const byInfinitive = new Map(verbs.map((v) => [v.infinitive, v]))
  return itemIds.flatMap((itemId) => {
    const parsed = parseConjItemId(itemId)
    const verb = parsed && byInfinitive.get(parsed.infinitive)
    if (!parsed || !verb || !(parsed.tense in TENSES)) return []
    const q = makeQuestion(verb, parsed.tense as Tense, parsed.person as Person)
    return q ? [q] : []
  })
}

/** 復習する項目 id から単語を取り出す。データから消えた単語は飛ばす */
export function vocabWordsFromItems(
  itemIds: readonly string[],
  words: readonly VocabWord[],
): VocabWord[] {
  const byId = new Map(words.map((w) => [w.id, w]))
  return itemIds.flatMap((itemId) => {
    const word = byId.get(parseVocabItemId(itemId) ?? '')
    return word ? [word] : []
  })
}

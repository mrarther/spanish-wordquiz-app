import { sample, shuffle, type Rng } from '../../utils/random'
import { normalize } from '../quiz/answerCheck'
import type { SrsOption } from '../quiz/generator'
import { vocabItemId } from '../srs/items'
import { prioritize } from '../srs/select'
import type { Level, VocabWord } from './types'

/** es-ja：スペイン語を見て意味を答える / ja-es：意味を見てスペイン語を答える */
export type Direction = 'es-ja' | 'ja-es'

export type VocabFilter = {
  categories: readonly string[]
  levels: readonly Level[]
}

export type VocabQuestion = {
  id: string
  word: VocabWord
  direction: Direction
  prompt: string
  answer: string
  /** 入力で正解として受け付ける形（冠詞あり・なし、同じ意味の別の語） */
  accepted: string[]
}

/** 名詞の定冠詞（el / la / 男女同形は el/la）。名詞以外や性のない語は null */
export function articleOf(w: VocabWord): string | null {
  if (w.pos !== 'noun' || !w.gender) return null
  if (w.article) return w.article
  return { m: 'el', f: 'la', mf: 'el/la' }[w.gender]
}

/** 冠詞付きの表示形（el libro, el/la estudiante） */
export function displayEs(w: VocabWord): string {
  const article = articleOf(w)
  return article ? `${article} ${w.es}` : w.es
}

/** 入力で受け付ける形。名詞は冠詞があってもなくてもよい */
export function acceptedEs(w: VocabWord): string[] {
  const article = articleOf(w)
  if (!article) return [w.es]
  return [w.es, ...article.split('/').map((a) => `${a} ${w.es}`)]
}

export function filterVocab(words: readonly VocabWord[], filter: VocabFilter): VocabWord[] {
  return words.filter(
    (w) => filter.categories.includes(w.category) && filter.levels.includes(w.level),
  )
}

/**
 * all は同じ意味の別の語を正解にするための全単語リスト。
 * 例：ja-es で「ジュース」と出たとき、zumo も jugo も正解にする
 */
export function makeVocabQuestion(
  word: VocabWord,
  direction: Direction,
  all: readonly VocabWord[],
): VocabQuestion {
  const id = `${word.id}:${direction}`
  if (direction === 'es-ja') {
    return { id, word, direction, prompt: displayEs(word), answer: word.ja, accepted: [word.ja] }
  }
  const synonyms = all.filter((w) => w.ja === word.ja)
  const accepted = [...new Set([word, ...synonyms].flatMap(acceptedEs))]
  return { id, word, direction, prompt: word.ja, answer: displayEs(word), accepted }
}

/** srs を渡すと、復習時期が来た単語 → 未出題 → それ以外の順に選ぶ */
export function generateVocabQuiz(
  all: readonly VocabWord[],
  opts: VocabFilter & { direction: Direction; count: number },
  rng: Rng = Math.random,
  srs?: SrsOption,
): VocabQuestion[] {
  const pool = filterVocab(all, opts)
  const words = srs
    ? prioritize(pool, vocabItemId, srs.progress, opts.count, srs.now, rng)
    : sample(pool, opts.count, rng)
  return words.map((w) => makeVocabQuestion(w, opts.direction, all))
}

/**
 * 4択の選択肢（正解を含む、並びはランダム）。
 * 誤答は紛らわしい順に選ぶ：同じカテゴリの同じ品詞 → 同じ品詞 → すべて。
 * 綴りか意味が正解と同じ語（naranja「オレンジ」と「オレンジ色の」など）は除く
 */
export function vocabChoices(
  q: VocabQuestion,
  all: readonly VocabWord[],
  rng: Rng = Math.random,
  n = 4,
): string[] {
  const label = (w: VocabWord) => (q.direction === 'es-ja' ? w.ja : displayEs(w))
  const seen = new Set([normalize(q.answer)])
  const wrong: string[] = []
  const add = (words: VocabWord[]) => {
    for (const w of shuffle(words, rng)) {
      if (wrong.length >= n - 1) return
      if (w.es === q.word.es || w.ja === q.word.ja) continue
      const text = label(w)
      if (seen.has(normalize(text))) continue
      seen.add(normalize(text))
      wrong.push(text)
    }
  }
  const samePos = all.filter((w) => w.pos === q.word.pos)
  add(samePos.filter((w) => w.category === q.word.category))
  add(samePos)
  add([...all])
  return shuffle([q.answer, ...wrong], rng)
}

import { describe, expect, it } from 'vitest'
import { BUILTIN_CLOZE } from '../../data/cloze'
import { VERBS } from '../../data/verbs'
import { VOCAB } from '../../data/vocab'
import { seededRng } from '../../utils/random'
import { conjItemId, parseConjItemId, parseVocabItemId, vocabItemId } from './items'
import { clozeQuestionsFromItems, conjQuestionsFromItems, vocabWordsFromItems } from './review'
import { prioritize } from './select'
import { DAY, RELEARN_DELAY, qualityOf, review, type SrsState } from './sm2'

const NOW = Date.UTC(2026, 8, 26)

describe('qualityOf', () => {
  it('正解 4・アクセントだけ違う正解 3・不正解 1', () => {
    expect(qualityOf({ correct: true, accentMistake: false })).toBe(4)
    expect(qualityOf({ correct: true, accentMistake: true })).toBe(3)
    expect(qualityOf({ correct: false, accentMistake: true })).toBe(1)
  })
})

describe('review（SM-2）', () => {
  it('正解が続くと間隔が 1日 → 6日 → 6×ease日 と伸びる', () => {
    const s1 = review(undefined, 4, NOW)
    expect(s1).toMatchObject({ reps: 1, interval: 1, due: NOW + DAY, lapses: 0 })
    const s2 = review(s1, 4, NOW)
    expect(s2).toMatchObject({ reps: 2, interval: 6, due: NOW + 6 * DAY })
    const s3 = review(s2, 4, NOW)
    expect(s3.interval).toBe(Math.round(6 * s2.ease))
  })

  it('間違えると連続正解が 0 に戻り、10分後に再出題される', () => {
    const s = review({ ...review(undefined, 4, NOW), reps: 3, interval: 15 }, 1, NOW)
    expect(s).toMatchObject({ reps: 0, interval: 0, lapses: 1, due: NOW + RELEARN_DELAY })
  })

  it('ease は 4 で変わらず、低い評価で下がり、1.3 を下回らない', () => {
    expect(review(undefined, 4, NOW).ease).toBeCloseTo(2.5)
    expect(review(undefined, 3, NOW).ease).toBeLessThan(2.5)
    let s: SrsState | undefined
    for (let i = 0; i < 20; i++) s = review(s, 1, NOW)
    expect(s!.ease).toBe(1.3)
  })
})

describe('prioritize', () => {
  const pool = ['a', 'b', 'c', 'd', 'e', 'f']
  const progress = new Map([
    ['a', { due: NOW + DAY }], // まだ
    ['b', { due: NOW - 2 * DAY }], // 期限切れ（古い）
    ['c', { due: NOW - DAY }], // 期限切れ
    ['d', { due: NOW + 2 * DAY }], // まだ
  ])
  const pick = (count: number) => prioritize(pool, (x) => x, progress, count, NOW, seededRng(1))

  it('復習時期が来たものを最優先し、古い順に選ぶ', () => {
    expect(pick(1)).toEqual(['b'])
    expect(pick(2).sort()).toEqual(['b', 'c'])
  })

  it('次にまだ解いていないもの、最後に復習時期がまだのもの（近い順）を選ぶ', () => {
    expect(pick(4).sort()).toEqual(['b', 'c', 'e', 'f'])
    expect(pick(5).sort()).toEqual(['a', 'b', 'c', 'e', 'f'])
    expect(pick(10).sort()).toEqual(pool)
  })
})

describe('復習の問題を作る', () => {
  it('項目 id から活用の問題と単語を作り、存在しないものは飛ばす', () => {
    const qs = conjQuestionsFromItems(
      ['conj:hablar:preterite:0', 'conj:nonexistent:present:0', 'conj:hablar:unknown:0'],
      VERBS,
    )
    expect(qs.map((q) => q.answer)).toEqual(['hablé'])

    const words = vocabWordsFromItems(['vocab:food:agua', 'vocab:food:nothing'], VOCAB)
    expect(words.map((w) => w.es)).toEqual(['agua'])

    const cloze = clozeQuestionsFromItems(['cloze:b001', 'cloze:deleted'], BUILTIN_CLOZE)
    expect(cloze.map((q) => q.answer)).toEqual(['hablo'])
  })
})

describe('項目 id', () => {
  it('活用と語彙の id を作り、元に戻せる', () => {
    expect(conjItemId({ id: 'hablar:present:0' })).toBe('conj:hablar:present:0')
    expect(parseConjItemId('conj:hablar:present:0')).toEqual({
      infinitive: 'hablar',
      tense: 'present',
      person: 0,
    })
    expect(parseConjItemId('vocab:food:agua')).toBeNull()
    expect(vocabItemId({ id: 'food:agua' })).toBe('vocab:food:agua')
    expect(parseVocabItemId('vocab:food:agua')).toBe('food:agua')
  })
})

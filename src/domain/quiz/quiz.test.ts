import { describe, expect, it } from 'vitest'
import { VERBS, findVerb } from '../../data/verbs'
import { seededRng } from '../../utils/random'
import { checkAnswer } from './answerCheck'
import { conjugationChoices } from './distractors'
import { buildConjugationPool, generateConjugationQuiz, makeQuestion } from './generator'

const hablar = findVerb('hablar')!

describe('checkAnswer', () => {
  it('完全一致は正解（大文字・前後の空白・連続した空白は無視）', () => {
    expect(checkAnswer('  Hablé ', ['hablé'], 'strict')).toEqual({
      correct: true,
      accentMistake: false,
    })
    expect(checkAnswer('he   hablado', ['he hablado'], 'strict').correct).toBe(true)
  })

  it('アクセント記号だけの違いは、strict では不正解、lenient では正解', () => {
    expect(checkAnswer('hable', ['hablé'], 'strict')).toEqual({
      correct: false,
      accentMistake: true,
    })
    expect(checkAnswer('hable', ['hablé'], 'lenient')).toEqual({
      correct: true,
      accentMistake: true,
    })
  })

  it('lenient でも ñ と n は区別する', () => {
    expect(checkAnswer('sonamos', ['soñamos'], 'lenient').correct).toBe(false)
  })

  it('別の形や空欄は不正解', () => {
    expect(checkAnswer('hablo', ['hablé'], 'lenient')).toEqual({
      correct: false,
      accentMistake: false,
    })
    expect(checkAnswer('', ['hablé'], 'lenient')).toEqual({ correct: false, accentMistake: false })
  })

  it('命令法の否定は "no" があってもなくても正解', () => {
    const q = makeQuestion(hablar, 'imperativeNegative', 1)!
    expect(q.answer).toBe('hables')
    expect(checkAnswer('hables', q.accepted, 'strict').correct).toBe(true)
    expect(checkAnswer('no hables', q.accepted, 'strict').correct).toBe(true)
  })
})

describe('generateConjugationQuiz', () => {
  const base = { tenses: ['present', 'preterite'] as const, groups: ['regular'] as const }

  it('指定した数だけ、重複なしで出題する', () => {
    const qs = generateConjugationQuiz(
      VERBS,
      { ...base, includeVosotros: true, count: 20 },
      seededRng(1),
    )
    expect(qs).toHaveLength(20)
    expect(new Set(qs.map((q) => q.id)).size).toBe(20)
  })

  it('時制・グループ・vosotros の条件を守る', () => {
    const pool = buildConjugationPool(VERBS, { ...base, includeVosotros: false })
    expect(pool.length).toBeGreaterThan(0)
    for (const q of pool) {
      expect(['present', 'preterite']).toContain(q.tense)
      expect(q.verb.group).toBe('regular')
      expect(q.person).not.toBe(4)
    }
  })

  it('命令法では yo を出題しない', () => {
    const pool = buildConjugationPool([hablar], {
      tenses: ['imperativeAffirmative'],
      groups: ['regular'],
      includeVosotros: true,
    })
    expect(pool.map((q) => q.person)).toEqual([1, 2, 3, 4, 5])
  })

  it('条件に合う問題が足りなければ、あるだけ返す', () => {
    const qs = generateConjugationQuiz([hablar], { ...base, includeVosotros: true, count: 100 })
    expect(qs).toHaveLength(12)
  })

  it('同じシードなら同じ問題になる', () => {
    const opts = { ...base, includeVosotros: true, count: 5 }
    const a = generateConjugationQuiz(VERBS, opts, seededRng(42)).map((q) => q.id)
    const b = generateConjugationQuiz(VERBS, opts, seededRng(42)).map((q) => q.id)
    expect(a).toEqual(b)
  })
})

describe('conjugationChoices', () => {
  it('正解を含む重複のない4択を作る', () => {
    const pool = buildConjugationPool(VERBS, {
      tenses: ['present', 'imperativeAffirmative', 'presentPerfect'],
      groups: ['regular', 'stem', 'irregular'],
      includeVosotros: true,
    })
    const rng = seededRng(7)
    for (const q of pool.filter((_, i) => i % 50 === 0)) {
      const choices = conjugationChoices(q, rng)
      expect(choices, q.id).toHaveLength(4)
      expect(choices).toContain(q.answer)
      expect(new Set(choices).size).toBe(4)
    }
  })

  it('誤答はまず同じ時制の別の人称から選ぶ', () => {
    const q = makeQuestion(hablar, 'present', 0)!
    const choices = conjugationChoices(q, seededRng(3))
    const present = ['hablo', 'hablas', 'habla', 'hablamos', 'habláis', 'hablan']
    for (const c of choices) expect(present).toContain(c)
  })
})

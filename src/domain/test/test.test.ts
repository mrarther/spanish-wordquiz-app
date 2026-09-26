import { describe, expect, it } from 'vitest'
import { BUILTIN_CLOZE } from '../../data/cloze'
import { VERBS } from '../../data/verbs'
import { VOCAB, VOCAB_CATEGORIES } from '../../data/vocab'
import { seededRng } from '../../utils/random'
import type { ClozeItem } from '../cloze/types'
import { ALL_TENSES, allocate, buildTestPools, composeTest, type TestRange } from './compose'
import { percent, scoreTest } from './score'

const custom: ClozeItem = {
  id: 'u1',
  sentence: 'Hoy [[como]] pan.',
  translation_ja: '今日はパンを食べる。',
  kind: 'conjugation',
  tags: ['mi-tag'],
  level: 'A1',
  source: 'custom',
}
const data = { verbs: VERBS, vocab: VOCAB, cloze: [...BUILTIN_CLOZE, custom] }
const range: TestRange = {
  sections: ['conj', 'vocab', 'cloze'],
  tenses: ALL_TENSES,
  levels: ['A1', 'A2', 'B1'],
  categories: VOCAB_CATEGORIES.map((c) => c.id),
  includeVosotros: true,
  includeCustom: true,
}

describe('allocate', () => {
  const plenty = { conj: 100, vocab: 100, cloze: 100 }

  it('選んだ分野に均等に割り振り、余りは並び順に1問ずつ', () => {
    expect(allocate(20, ['conj', 'vocab', 'cloze'], plenty)).toEqual({
      conj: 7,
      vocab: 7,
      cloze: 6,
    })
    expect(allocate(10, ['vocab', 'cloze'], plenty)).toEqual({ conj: 0, vocab: 5, cloze: 5 })
  })

  it('候補が足りない分野の不足分をほかの分野に回す', () => {
    expect(allocate(20, ['conj', 'vocab', 'cloze'], { conj: 100, vocab: 2, cloze: 100 })).toEqual({
      conj: 9,
      vocab: 2,
      cloze: 9,
    })
  })

  it('候補の合計より多くは出さない。候補のない分野は飛ばす', () => {
    expect(allocate(50, ['conj', 'vocab'], { conj: 3, vocab: 4, cloze: 100 })).toEqual({
      conj: 3,
      vocab: 4,
      cloze: 0,
    })
    expect(allocate(10, ['cloze'], { conj: 100, vocab: 100, cloze: 0 })).toEqual({
      conj: 0,
      vocab: 0,
      cloze: 0,
    })
  })
})

describe('buildTestPools', () => {
  it('範囲の時制・レベル・カテゴリで絞り込む', () => {
    const pools = buildTestPools(
      {
        ...range,
        tenses: ['preterite'],
        levels: ['A1'],
        categories: ['food'],
        includeVosotros: false,
      },
      data,
    )
    expect(pools.conj.every((q) => q.section === 'conj' && q.conj.tense === 'preterite')).toBe(true)
    expect(pools.conj.some((q) => q.section === 'conj' && q.conj.person === 4)).toBe(false)
    for (const q of pools.vocab) {
      if (q.section !== 'vocab') throw new Error()
      expect(q.vocab.word).toMatchObject({ category: 'food', level: 'A1' })
      expect(q.vocab.direction).toBe('ja-es')
    }
    for (const q of pools.cloze) {
      if (q.section !== 'cloze') throw new Error()
      const { item } = q.cloze
      expect(item.level).toBe('A1')
      if (item.source === 'builtin') expect(['preterite', 'food']).toContain(item.tags[0])
    }
  })

  it('自作問題はタグに関係なく含め、includeCustom が false なら除く', () => {
    const ids = (r: TestRange) => buildTestPools(r, data).cloze.map((q) => q.id)
    expect(ids(range)).toContain('cloze:u1')
    expect(ids({ ...range, includeCustom: false })).not.toContain('cloze:u1')
  })
})

describe('composeTest', () => {
  it('分野を混ぜて、指定した数を重複なしで出題する', () => {
    const qs = composeTest(range, 30, data, seededRng(1))
    expect(qs).toHaveLength(30)
    expect(new Set(qs.map((q) => q.id)).size).toBe(30)
    for (const s of ['conj', 'vocab', 'cloze'] as const) {
      expect(qs.filter((q) => q.section === s)).toHaveLength(10)
    }
  })

  it('選ばなかった分野は出題しない', () => {
    const qs = composeTest({ ...range, sections: ['vocab'] }, 10, data, seededRng(2))
    expect(qs.every((q) => q.section === 'vocab')).toBe(true)
  })
})

describe('scoreTest', () => {
  const qs = composeTest(range, 9, data, seededRng(3))

  it('まとめて採点し、分野別に集計する。未回答は不正解', () => {
    const answers: Record<string, string> = {}
    qs.slice(0, 4).forEach((q) => (answers[q.id] = q.answer))
    answers[qs[4].id] = 'xxx'
    const score = scoreTest(qs, answers, 'strict')
    expect(score).toMatchObject({ total: 9, correct: 4 })
    const sum = Object.values(score.bySection).reduce((a, s) => a + s.total, 0)
    expect(sum).toBe(9)
    expect(score.results.filter((r) => !r.answered)).toHaveLength(4)
    expect(score.results[4]).toMatchObject({ answered: true, correct: false })
  })

  it('アクセントの扱いは設定に従う', () => {
    const q = qs.find((x) => /[áéíóú]/.test(x.answer))
    if (!q) return
    const bare = q.answer.normalize('NFD').replace(/́/g, '')
    expect(scoreTest([q], { [q.id]: bare }, 'strict').correct).toBe(0)
    expect(scoreTest([q], { [q.id]: bare }, 'lenient').correct).toBe(1)
  })

  it('正答率', () => {
    expect(percent({ total: 3, correct: 2 })).toBe(67)
    expect(percent({ total: 0, correct: 0 })).toBe(0)
  })
})

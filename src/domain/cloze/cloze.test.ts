import { describe, expect, it } from 'vitest'
import { BUILTIN_CLOZE } from '../../data/cloze'
import { VERBS } from '../../data/verbs'
import { VOCAB } from '../../data/vocab'
import { seededRng } from '../../utils/random'
import { conjugateAll } from '../conjugation/conjugate'
import { TENSES, type Tense } from '../conjugation/types'
import { checkAnswer } from '../quiz/answerCheck'
import { exportCloze, parseClozeImport } from './io'
import { countBlanks, fillCloze, formatCloze, parseCloze } from './parse'
import { clozeChoices, filterCloze, generateClozeQuiz, makeClozeQuestion } from './quiz'
import type { ClozeItem } from './types'
import { cleanDraft, isValid, validateCloze, type ClozeDraft } from './validate'

const draft = (patch: Partial<ClozeDraft> = {}): ClozeDraft => ({
  sentence: 'Ayer yo [[comí]] paella.',
  translation_ja: '昨日私はパエリアを食べた。',
  hint: 'comer',
  kind: 'conjugation',
  tags: ['preterite'],
  level: 'A1',
  ...patch,
})

describe('parseCloze', () => {
  it('空欄の前・答え・後に分け、元に戻せる', () => {
    const p = parseCloze('Ayer yo [[comí]] paella.')
    expect(p).toEqual({ before: 'Ayer yo ', answer: 'comí', after: ' paella.' })
    expect(formatCloze(p!)).toBe('Ayer yo [[comí]] paella.')
  })

  it('空欄に答えを入れた例文を作る', () => {
    expect(fillCloze(parseCloze('¿[[Tienes]] hermanos?')!)).toBe('¿Tienes hermanos?')
  })

  it('答えの前後の空白は除き、複数語の答えも扱える', () => {
    expect(parseCloze('Hoy [[ he comido ]] mucho.')?.answer).toBe('he comido')
  })

  it('空欄が0個・2個以上・空・括弧の書き間違いは null', () => {
    expect(parseCloze('Ayer yo comí paella.')).toBeNull()
    expect(parseCloze('[[Yo]] [[comí]] paella.')).toBeNull()
    expect(parseCloze('Ayer yo [[ ]] paella.')).toBeNull()
    expect(parseCloze('Ayer yo [[comí] paella.')).toBeNull()
    expect(countBlanks('[[a]] y [[b]]')).toBe(2)
  })
})

describe('validateCloze', () => {
  it('正しい下書きには誤りがない', () => {
    expect(validateCloze(draft())).toEqual({})
  })

  it('例文の誤りを具体的に伝える', () => {
    expect(validateCloze(draft({ sentence: '' })).sentence).toMatch('入力')
    expect(validateCloze(draft({ sentence: 'Ayer yo comí.' })).sentence).toMatch('[[ ]] で囲んで')
    expect(validateCloze(draft({ sentence: '[[a]] [[b]]' })).sentence).toMatch('1つだけ')
    expect(validateCloze(draft({ sentence: 'Ayer [[ ]].' })).sentence).toMatch('答えを書いて')
    expect(validateCloze(draft({ sentence: 'Ayer [[comí].' })).sentence).toMatch('組み合わせ')
    expect(validateCloze(draft({ sentence: `[[a]]${'x'.repeat(300)}` })).sentence).toMatch(
      '300文字',
    )
  })

  it('日本語訳・種類・レベルは必須', () => {
    const errors = validateCloze(draft({ translation_ja: ' ', kind: 'x', level: 'C9' }))
    expect(Object.keys(errors).sort()).toEqual(['kind', 'level', 'translation_ja'])
  })

  it('別解・タグの空白と重複、正解と同じ別解を取り除く', () => {
    const d = cleanDraft(
      draft({ alternatives: [' Comí ', 'comi', 'comi', ''], tags: [' preterite ', 'preterite'] }),
    )
    expect(d.alternatives).toEqual(['comi'])
    expect(d.tags).toEqual(['preterite'])
  })
})

describe('import / export', () => {
  let n = 0
  const newId = () => `new-${++n}`

  it('エクスポートした問題を読み込み直すと同じ内容になる', () => {
    const items: ClozeItem[] = [
      {
        ...draft(),
        id: 'u1',
        kind: 'conjugation',
        level: 'A1',
        tags: ['preterite'],
        source: 'custom',
      },
    ]
    const { items: back, errors } = parseClozeImport(exportCloze(items), newId, new Set(), 5)
    expect(errors).toEqual([])
    expect(back).toEqual([{ ...items[0], updatedAt: 5 }])
  })

  it('誤りのある問題は飛ばして理由を返し、id がない・予約済み・重複なら新しい id を付ける', () => {
    const json = JSON.stringify([
      { ...draft() },
      { ...draft(), id: 'b001' },
      { ...draft(), id: 'same' },
      { ...draft(), id: 'same' },
      { ...draft(), sentence: 'no blank' },
    ])
    const { items, errors } = parseClozeImport(json, newId, new Set(['b001']))
    expect(items.map((i) => i.id)).toEqual(['new-1', 'new-2', 'same', 'new-3'])
    expect(items.every((i) => i.source === 'custom')).toBe(true)
    expect(errors).toHaveLength(1)
    expect(errors[0]).toMatch(/^5件目：/)
  })

  it('JSON でない・一覧がないファイルはエラー', () => {
    expect(parseClozeImport('{', newId, new Set()).errors[0]).toMatch('JSON')
    expect(parseClozeImport('{"a":1}', newId, new Set()).errors[0]).toMatch('items')
  })
})

describe('組み込みの穴埋め問題（cloze.json）', () => {
  it('約200問あり、id が重複していない', () => {
    expect(BUILTIN_CLOZE.length).toBeGreaterThanOrEqual(200)
    expect(new Set(BUILTIN_CLOZE.map((i) => i.id)).size).toBe(BUILTIN_CLOZE.length)
  })

  it.each(BUILTIN_CLOZE.map((i) => [i.id, i] as const))('%s は入力チェックを通る', (_, item) => {
    expect(validateCloze(item)).toEqual({})
  })

  const conj = BUILTIN_CLOZE.filter((i) => i.kind === 'conjugation')
  it.each(conj.map((i) => [i.id, i.sentence, i] as const))(
    '%s「%s」の答えは、ヒントの動詞のタグの時制の形',
    (_, __, item) => {
      const verb = VERBS.find((v) => v.infinitive === item.hint)
      expect(verb, item.hint).toBeDefined()
      const tense = item.tags.find((t): t is Tense => t in TENSES)
      expect(tense).toBeDefined()
      const answer = parseCloze(item.sentence)!.answer.toLowerCase()
      expect(conjugateAll(verb!, tense!)).toContain(answer)
    },
  )

  const vocab = BUILTIN_CLOZE.filter((i) => i.kind === 'vocab')
  it.each(vocab.map((i) => [i.id, i.sentence, i] as const))(
    '%s「%s」の答えは語彙データにあり、タグはそのカテゴリ',
    (_, __, item) => {
      const answer = parseCloze(item.sentence)!.answer.toLowerCase()
      const words = VOCAB.filter((w) => w.es === answer)
      expect(words.map((w) => w.category)).toContain(item.tags[0])
    },
  )
})

describe('出題', () => {
  const custom: ClozeItem = { ...BUILTIN_CLOZE[0], id: 'u1', source: 'custom' }
  const all = [...BUILTIN_CLOZE, custom]
  const filter = { kinds: ['conjugation', 'vocab'] as const, levels: ['A1', 'A2', 'B1'] as const }

  it('種類・レベル・タグ・自作のみで絞り込む', () => {
    expect(
      filterCloze(all, { ...filter, kinds: ['vocab'], tags: [], customOnly: false }).every(
        (i) => i.kind === 'vocab',
      ),
    ).toBe(true)
    const past = filterCloze(all, { ...filter, tags: ['preterite'], customOnly: false })
    expect(past.length).toBeGreaterThan(0)
    expect(past.every((i) => i.tags.includes('preterite'))).toBe(true)
    expect(filterCloze(all, { ...filter, tags: [], customOnly: true })).toEqual([custom])
  })

  it('指定した数だけ重複なしで出題し、別解も正解にする', () => {
    const qs = generateClozeQuiz(
      all,
      { ...filter, tags: [], customOnly: false, count: 20 },
      seededRng(1),
    )
    expect(qs).toHaveLength(20)
    expect(new Set(qs.map((q) => q.id)).size).toBe(20)

    const q = makeClozeQuestion({ ...custom, alternatives: ['platicó'] })!
    expect(checkAnswer('platicó', q.accepted, 'strict').correct).toBe(true)
  })

  it('すべての組み込み問題で、正解を含む重複のない4択を作れる', () => {
    const rng = seededRng(3)
    for (const item of BUILTIN_CLOZE) {
      const q = makeClozeQuestion(item)!
      const choices = clozeChoices(q, BUILTIN_CLOZE, { verbs: VERBS, vocab: VOCAB }, rng)
      expect(choices, item.id).toHaveLength(4)
      expect(choices).toContain(q.answer)
      expect(new Set(choices.map((c) => c.toLowerCase())).size).toBe(4)
    }
  })

  it('活用の誤答はヒントの動詞の形から選び、文頭なら大文字にする', () => {
    const item = BUILTIN_CLOZE.find((i) => i.sentence.startsWith('¿[[Tienes]]'))!
    const choices = clozeChoices(makeClozeQuestion(item)!, BUILTIN_CLOZE, {
      verbs: VERBS,
      vocab: VOCAB,
    })
    const tener = VERBS.find((v) => v.infinitive === 'tener')!
    const present = conjugateAll(tener, 'present').map((f) =>
      f!.replace(/^./, (c) => c.toUpperCase()),
    )
    for (const c of choices) expect(present).toContain(c)
  })

  it('例文が壊れた問題は出題しない', () => {
    expect(makeClozeQuestion({ ...custom, sentence: 'no blank' })).toBeNull()
    expect(isValid(validateCloze({ ...custom, sentence: 'no blank' }))).toBe(false)
  })
})

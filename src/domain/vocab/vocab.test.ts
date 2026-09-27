import { describe, expect, it } from 'vitest'
import { VERBS } from '../../data/verbs'
import { VOCAB, VOCAB_CATEGORIES } from '../../data/vocab'
import { seededRng } from '../../utils/random'
import { checkAnswer } from '../quiz/answerCheck'
import {
  acceptedEs,
  displayEs,
  filterVocab,
  generateVocabQuiz,
  makeVocabQuestion,
  vocabChoices,
} from './quiz'
import { POS_LABELS } from './types'

function word(id: string) {
  const w = VOCAB.find((v) => v.id === id)
  if (!w) throw new Error(`${id} がありません`)
  return w
}

describe('vocab/*.json', () => {
  it('約500語以上ある', () => {
    expect(VOCAB.length).toBeGreaterThanOrEqual(500)
  })

  it('id（カテゴリ:単語）が重複していない', () => {
    const ids = VOCAB.map((w) => w.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('カテゴリ id が重複していない', () => {
    const ids = VOCAB_CATEGORIES.map((c) => c.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it.each(VOCAB.map((w) => [w.id, w] as const))('%s の書式が正しい', (_, w) => {
    expect(w.es).toMatch(/^[a-záéíóúüñ ]+$/)
    expect(w.es).toBe(w.es.trim())
    expect(w.ja).not.toBe('')
    expect(Object.keys(POS_LABELS)).toContain(w.pos)
    expect(['A1', 'A2', 'B1', 'B2']).toContain(w.level)
    if (w.gender) expect(['m', 'f', 'mf']).toContain(w.gender)
    if (w.gender || w.article) expect(w.pos).toBe('noun')
  })
})

describe('冠詞', () => {
  it('性に応じた冠詞を付けて表示する', () => {
    expect(displayEs(word('house:libro'))).toBe('el libro')
    expect(displayEs(word('house:casa'))).toBe('la casa')
    expect(displayEs(word('school_work:estudiante'))).toBe('el/la estudiante')
    expect(displayEs(word('food:agua'))).toBe('el agua')
    expect(displayEs(word('time:enero'))).toBe('enero')
    expect(displayEs(word('adjectives:grande'))).toBe('grande')
  })

  it('入力は冠詞があってもなくてもよい', () => {
    expect(acceptedEs(word('house:libro'))).toEqual(['libro', 'el libro'])
    expect(acceptedEs(word('school_work:estudiante'))).toEqual([
      'estudiante',
      'el estudiante',
      'la estudiante',
    ])
  })
})

describe('makeVocabQuestion', () => {
  it('es-ja はスペイン語を見て意味を答える', () => {
    const q = makeVocabQuestion(word('house:libro'), 'es-ja', VOCAB)
    expect(q.prompt).toBe('el libro')
    expect(q.answer).toBe('本')
  })

  it('ja-es は意味を見てスペイン語を答え、冠詞なし・アクセントのゆるめ判定も受け付ける', () => {
    const q = makeVocabQuestion(word('travel:autobús'), 'ja-es', VOCAB)
    expect(q.prompt).toBe('バス')
    expect(q.answer).toBe('el autobús')
    expect(checkAnswer('autobús', q.accepted, 'strict').correct).toBe(true)
    expect(checkAnswer('el autobus', q.accepted, 'lenient').correct).toBe(true)
    expect(checkAnswer('el autobus', q.accepted, 'strict').correct).toBe(false)
  })

  it('同じ意味の別の語も正解にする', () => {
    const synonyms = VOCAB.filter((w) => w.ja === '夫')
    const q = makeVocabQuestion(synonyms[0], 'ja-es', [
      ...VOCAB,
      { ...synonyms[0], id: 'x', es: 'marido' },
    ])
    expect(q.accepted).toContain('marido')
  })
})

describe('generateVocabQuiz', () => {
  it('カテゴリ・レベルで絞り込み、重複なしで出題する', () => {
    const qs = generateVocabQuiz(
      VOCAB,
      { categories: ['food', 'time'], levels: ['A1'], direction: 'ja-es', count: 30 },
      seededRng(1),
    )
    expect(qs).toHaveLength(30)
    expect(new Set(qs.map((q) => q.id)).size).toBe(30)
    for (const q of qs) {
      expect(['food', 'time']).toContain(q.word.category)
      expect(q.word.level).toBe('A1')
    }
  })

  it('条件に合う語が少なければ、あるだけ返す', () => {
    const colorsA2 = filterVocab(VOCAB, { categories: ['colors'], levels: ['A2'] })
    const qs = generateVocabQuiz(VOCAB, {
      categories: ['colors'],
      levels: ['A2'],
      direction: 'es-ja',
      count: 100,
    })
    expect(qs).toHaveLength(colorsA2.length)
  })
})

describe('vocabChoices', () => {
  it('すべての語で、正解を含む重複のない4択を作れる', () => {
    const rng = seededRng(5)
    for (const w of VOCAB) {
      for (const direction of ['es-ja', 'ja-es'] as const) {
        const q = makeVocabQuestion(w, direction, VOCAB)
        const choices = vocabChoices(q, VOCAB, rng)
        expect(choices, q.id).toHaveLength(4)
        expect(choices).toContain(q.answer)
        expect(new Set(choices).size).toBe(4)
      }
    }
  })

  it('綴りか意味が同じ語は誤答にしない', () => {
    const q = makeVocabQuestion(word('food:naranja'), 'es-ja', VOCAB)
    const rng = seededRng(9)
    for (let i = 0; i < 20; i++) {
      expect(vocabChoices(q, VOCAB, rng)).not.toContain('オレンジ色の')
    }
  })

  it('誤答はまず同じカテゴリの同じ品詞から選ぶ', () => {
    const q = makeVocabQuestion(word('time:lunes'), 'ja-es', VOCAB)
    const timeNouns = VOCAB.filter((w) => w.category === 'time' && w.pos === 'noun').map(displayEs)
    for (const c of vocabChoices(q, VOCAB, seededRng(2))) expect(timeNouns).toContain(c)
  })
})

describe('動詞カテゴリ', () => {
  const verbs = VOCAB.filter((w) => w.category === 'verbs')

  it('verbs.json のすべての動詞が、原形・意味・レベル付きで入っている', () => {
    expect(verbs).toHaveLength(VERBS.length)
    expect(word('verbs:hablar')).toMatchObject({
      es: 'hablar',
      ja: '話す',
      pos: 'verb',
      level: 'A1',
    })
    expect(VOCAB_CATEGORIES.find((c) => c.id === 'verbs')).toMatchObject({
      label_ja: '動詞',
      count: VERBS.length,
    })
  })

  it('動詞の4択は、両方の向きで選択肢がすべて動詞になる', () => {
    const verbSpanish = new Set(verbs.map((w) => w.es))
    const verbMeanings = new Set(verbs.map((w) => w.ja))
    const rng = seededRng(11)
    for (const w of verbs) {
      const esJa = vocabChoices(makeVocabQuestion(w, 'es-ja', VOCAB), VOCAB, rng)
      expect(
        esJa.every((c) => verbMeanings.has(c)),
        w.es,
      ).toBe(true)
      const jaEs = vocabChoices(makeVocabQuestion(w, 'ja-es', VOCAB), VOCAB, rng)
      expect(
        jaEs.every((c) => verbSpanish.has(c)),
        w.es,
      ).toBe(true)
      expect(new Set(jaEs).size).toBe(4)
    }
  })

  it('同じ意味の動詞は、スペル入力でどちらも正解になる', () => {
    const q = makeVocabQuestion(word('verbs:contestar'), 'ja-es', VOCAB)
    expect(q.prompt).toBe('答える')
    expect(checkAnswer('responder', q.accepted, 'strict').correct).toBe(true)
  })
})

import { describe, expect, it } from 'vitest'
import { conjugateAll } from '../domain/conjugation/conjugate'
import { TENSES, type Tense } from '../domain/conjugation/types'
import { VERBS } from './verbs'

const SIMPLE_TENSES = new Set([
  'present',
  'preterite',
  'imperfect',
  'future',
  'conditional',
  'subjunctivePresent',
  'subjunctiveImperfect',
  'imperativeAffirmative',
  'imperativeNegative',
])

describe('verbs.json', () => {
  it('不定詞が重複していない', () => {
    const names = VERBS.map((v) => v.infinitive)
    expect(new Set(names).size).toBe(names.length)
  })

  it.each(VERBS.map((v) => [v.infinitive, v] as const))('%s の書式が正しい', (_, v) => {
    expect(v.infinitive).toMatch(/(ar|er|ir|ír)$/)
    expect(v.meaning_ja).not.toBe('')
    expect(['regular', 'stem', 'irregular']).toContain(v.group)
    for (const [tense, forms] of Object.entries(v.irregular ?? {})) {
      expect(SIMPLE_TENSES, tense).toContain(tense)
      expect(forms.length).toBeLessThanOrEqual(6)
    }
  })

  const regulars = VERBS.filter((v) => v.group === 'regular')

  it.each(regulars.map((v) => [v.infinitive, v] as const))(
    '%s（regular）は不規則の指定を持たない',
    (_, v) => {
      const { infinitive, meaning_ja, group, ...rest } = v
      expect(rest).toEqual({})
      // エンジンが自動で扱えない型の動詞は regular にしない
      expect(infinitive).not.toMatch(/[^gq]uir$|eer$|[aeiou]c[ei]r$|uar$/)
      expect(meaning_ja && group).toBeTruthy()
    },
  )

  it.each(VERBS.map((v) => [v.infinitive, v] as const))('%s は全時制を活用できる', (_, v) => {
    for (const tense of Object.keys(TENSES) as Tense[]) {
      const forms = conjugateAll(v, tense)
      expect(forms).toHaveLength(6)
      forms.forEach((form, p) => {
        if (tense.startsWith('imperative') && p === 0) expect(form).toBeNull()
        else expect(form, `${tense}[${p}]`).toMatch(/^[a-záéíóúüñ ]+$/)
      })
    }
  })
})

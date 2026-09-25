export type VerbClass = 'ar' | 'er' | 'ir'

export function stripAccents(s: string): string {
  return s.normalize('NFD').replace(/[̀-́]/g, '').normalize('NFC')
}

export function verbClass(infinitive: string): VerbClass {
  const ending = stripAccents(infinitive).slice(-2)
  if (ending === 'ar' || ending === 'er' || ending === 'ir') return ending
  throw new Error(`不定詞ではありません: ${infinitive}`)
}

export function stemOf(infinitive: string): string {
  return infinitive.slice(0, -2)
}

type EndingTable = Record<VerbClass, readonly string[]>

export const PRESENT: EndingTable = {
  ar: ['o', 'as', 'a', 'amos', 'áis', 'an'],
  er: ['o', 'es', 'e', 'emos', 'éis', 'en'],
  ir: ['o', 'es', 'e', 'imos', 'ís', 'en'],
}

export const PRETERITE: EndingTable = {
  ar: ['é', 'aste', 'ó', 'amos', 'asteis', 'aron'],
  er: ['í', 'iste', 'ió', 'imos', 'isteis', 'ieron'],
  ir: ['í', 'iste', 'ió', 'imos', 'isteis', 'ieron'],
}

/** 強変化の点過去（tuve, tuviste, tuvo ...）。3人称複数は語幹に応じて -ieron / -eron */
export const STRONG_PRETERITE = ['e', 'iste', 'o', 'imos', 'isteis'] as const

export const IMPERFECT: EndingTable = {
  ar: ['aba', 'abas', 'aba', 'ábamos', 'abais', 'aban'],
  er: ['ía', 'ías', 'ía', 'íamos', 'íais', 'ían'],
  ir: ['ía', 'ías', 'ía', 'íamos', 'íais', 'ían'],
}

export const SUBJUNCTIVE_PRESENT: EndingTable = {
  ar: ['e', 'es', 'e', 'emos', 'éis', 'en'],
  er: ['a', 'as', 'a', 'amos', 'áis', 'an'],
  ir: ['a', 'as', 'a', 'amos', 'áis', 'an'],
}

export const FUTURE = ['é', 'ás', 'á', 'emos', 'éis', 'án'] as const

export const CONDITIONAL = ['ía', 'ías', 'ía', 'íamos', 'íais', 'ían'] as const

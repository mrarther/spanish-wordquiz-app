import type { CompoundTense, Tense } from './types'

/** 複合時制で使う haber の活用 */
export const HABER: Record<CompoundTense, readonly string[]> = {
  presentPerfect: ['he', 'has', 'ha', 'hemos', 'habéis', 'han'],
  pluperfect: ['había', 'habías', 'había', 'habíamos', 'habíais', 'habían'],
  futurePerfect: ['habré', 'habrás', 'habrá', 'habremos', 'habréis', 'habrán'],
  conditionalPerfect: ['habría', 'habrías', 'habría', 'habríamos', 'habríais', 'habrían'],
  subjunctivePresentPerfect: ['haya', 'hayas', 'haya', 'hayamos', 'hayáis', 'hayan'],
  subjunctivePluperfect: ['hubiera', 'hubieras', 'hubiera', 'hubiéramos', 'hubierais', 'hubieran'],
}

export function isCompound(tense: Tense): tense is CompoundTense {
  return tense in HABER
}

export function compoundForms(tense: CompoundTense, participle: string): string[] {
  return HABER[tense].map((aux) => `${aux} ${participle}`)
}

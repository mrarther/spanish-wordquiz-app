import type { VerbEntry } from '../domain/conjugation/types'
import raw from './verbs.json'

export const VERBS: VerbEntry[] = raw as VerbEntry[]

export function findVerb(infinitive: string): VerbEntry | undefined {
  return VERBS.find((v) => v.infinitive === infinitive)
}

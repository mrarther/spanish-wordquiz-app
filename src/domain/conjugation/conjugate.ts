import { compoundForms, isCompound } from './compound'
import { join } from './orthographic'
import {
  CONDITIONAL,
  FUTURE,
  IMPERFECT,
  PRESENT,
  PRETERITE,
  STRONG_PRETERITE,
  SUBJUNCTIVE_PRESENT,
  stemOf,
  stripAccents,
  verbClass,
} from './regular'
import { longStem, shortStem } from './stemChange'
import type { Forms, Person, SimpleTense, Tense, VerbEntry } from './types'

/** 語幹変化が起こる人称（yo, tú, él, ellos） */
const BOOT: readonly number[] = [0, 1, 2, 5]

/**
 * 活用形を1つ返す。命令法の yo のように存在しない形は null。
 * 命令法（否定）は "no" を含まない形（hables）を返す。複合時制は "he hablado" のように haber を含む。
 */
export function conjugate(verb: VerbEntry, tense: Tense, person: Person): string | null {
  return conjugateAll(verb, tense)[person] ?? null
}

/** 6人称分の活用形を返す */
export function conjugateAll(verb: VerbEntry, tense: Tense): Forms {
  if (isCompound(tense)) return compoundForms(tense, pastParticiple(verb))
  return simpleForms(verb, tense)
}

export function pastParticiple(verb: VerbEntry): string {
  if (verb.pastParticiple) return verb.pastParticiple
  const ending = verbClass(verb.infinitive) === 'ar' ? 'ado' : 'ido'
  return join(verb.infinitive, stemOf(verb.infinitive), ending, verb)
}

export function gerund(verb: VerbEntry): string {
  if (verb.gerund) return verb.gerund
  const { stems } = parts(verb)
  const ending = verbClass(verb.infinitive) === 'ar' ? 'ando' : 'iendo'
  return join(verb.infinitive, stems.short, ending, verb)
}

function parts(verb: VerbEntry) {
  const inf = verb.infinitive
  const cls = verbClass(inf)
  const stem = stemOf(inf)
  const stems = {
    plain: stem,
    long: longStem(stem, verb.stemChange),
    short: cls === 'ir' ? shortStem(stem, verb.stemChange) : stem,
  }
  const j = (s: string, e: string) => join(inf, s, e, verb)
  return { inf, cls, stems, j }
}

/** 規則生成 → 語幹変化 → 綴り変化 の結果を、irregular に書かれた形で上書きする */
function simpleForms(verb: VerbEntry, tense: SimpleTense): Forms {
  const override = verb.irregular?.[tense]
  return computeSimple(verb, tense).map((form, p) => override?.[p] ?? form)
}

function computeSimple(verb: VerbEntry, tense: SimpleTense): Forms {
  const { inf, cls, stems, j } = parts(verb)

  switch (tense) {
    case 'present':
      return PRESENT[cls].map((e, p) => j(BOOT.includes(p) ? stems.long : stems.plain, e))

    case 'preterite': {
      const strong = verb.preteriteStem
      if (strong) {
        const endings = [...STRONG_PRETERITE, strong.endsWith('j') ? 'eron' : 'ieron']
        return endings.map((e) => strong + e)
      }
      return PRETERITE[cls].map((e, p) => j(p === 2 || p === 5 ? stems.short : stems.plain, e))
    }

    case 'imperfect':
      return IMPERFECT[cls].map((e) => j(stems.plain, e))

    case 'future':
    case 'conditional': {
      const stem = verb.futureStem ?? stripAccents(inf)
      return (tense === 'future' ? FUTURE : CONDITIONAL).map((e) => stem + e)
    }

    case 'subjunctivePresent': {
      // 直説法現在の yo が不規則（tengo, hago）なら、その形から語幹を作る。
      // 接続法現在を irregular で指定している動詞（oler など）は、残りの人称を通常の規則で作る
      const yo = verb.irregular?.present?.[0]
      if (yo?.endsWith('o') && !verb.irregular?.subjunctivePresent) {
        const stem = yo.slice(0, -1)
        return SUBJUNCTIVE_PRESENT[cls].map((e) => stem + e)
      }
      return SUBJUNCTIVE_PRESENT[cls].map((e, p) =>
        j(BOOT.includes(p) ? stems.long : stems.short, e),
      )
    }

    case 'subjunctiveImperfect': {
      // 点過去の3人称複数（tuvieron）から -ron を除いた形が語幹になる
      const base = (simpleForms(verb, 'preterite')[5] ?? '').slice(0, -3)
      return ['ra', 'ras', 'ra', 'ramos', 'rais', 'ran'].map((e, p) =>
        p === 3 ? accentLastVowel(base) + e : base + e,
      )
    }

    case 'imperativeAffirmative': {
      const present = simpleForms(verb, 'present')
      const subj = simpleForms(verb, 'subjunctivePresent')
      return [null, present[2], subj[2], subj[3], inf.slice(0, -1) + 'd', subj[5]]
    }

    case 'imperativeNegative': {
      const subj = simpleForms(verb, 'subjunctivePresent')
      return [null, subj[1], subj[2], subj[3], subj[4], subj[5]]
    }
  }
}

const ACCENTED: Record<string, string> = { a: 'á', e: 'é', i: 'í', o: 'ó', u: 'ú' }

function accentLastVowel(s: string): string {
  const last = s.at(-1) ?? ''
  return ACCENTED[last] ? s.slice(0, -1) + ACCENTED[last] : s
}

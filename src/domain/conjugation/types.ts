/** 人称のインデックス：0=yo, 1=tú, 2=él/ella/usted, 3=nosotros, 4=vosotros, 5=ellos/ellas/ustedes */
export type Person = 0 | 1 | 2 | 3 | 4 | 5

export const PERSONS: readonly Person[] = [0, 1, 2, 3, 4, 5]

export const PERSON_LABELS: Record<Person, string> = {
  0: 'yo',
  1: 'tú',
  2: 'él / ella / usted',
  3: 'nosotros',
  4: 'vosotros',
  5: 'ellos / ellas / ustedes',
}

export type Mood = 'indicative' | 'subjunctive' | 'imperative'

export type SimpleTense =
  | 'present'
  | 'preterite'
  | 'imperfect'
  | 'future'
  | 'conditional'
  | 'subjunctivePresent'
  | 'subjunctiveImperfect'
  | 'imperativeAffirmative'
  | 'imperativeNegative'

export type CompoundTense =
  | 'presentPerfect'
  | 'pluperfect'
  | 'futurePerfect'
  | 'conditionalPerfect'
  | 'subjunctivePresentPerfect'
  | 'subjunctivePluperfect'

export type Tense = SimpleTense | CompoundTense

export const TENSES: Record<Tense, { mood: Mood; label_ja: string }> = {
  present: { mood: 'indicative', label_ja: '直説法現在' },
  preterite: { mood: 'indicative', label_ja: '直説法点過去' },
  imperfect: { mood: 'indicative', label_ja: '直説法線過去' },
  future: { mood: 'indicative', label_ja: '直説法未来' },
  conditional: { mood: 'indicative', label_ja: '直説法過去未来' },
  presentPerfect: { mood: 'indicative', label_ja: '直説法現在完了' },
  pluperfect: { mood: 'indicative', label_ja: '直説法過去完了' },
  futurePerfect: { mood: 'indicative', label_ja: '直説法未来完了' },
  conditionalPerfect: { mood: 'indicative', label_ja: '直説法過去未来完了' },
  subjunctivePresent: { mood: 'subjunctive', label_ja: '接続法現在' },
  subjunctiveImperfect: { mood: 'subjunctive', label_ja: '接続法過去（-ra形）' },
  subjunctivePresentPerfect: { mood: 'subjunctive', label_ja: '接続法現在完了' },
  subjunctivePluperfect: { mood: 'subjunctive', label_ja: '接続法過去完了' },
  imperativeAffirmative: { mood: 'imperative', label_ja: '命令法（肯定）' },
  imperativeNegative: { mood: 'imperative', label_ja: '命令法（否定）' },
}

/** i>í・u>ú はアクセントの移動（enviar → envío, continuar → continúo） */
export type StemChange = 'e>ie' | 'o>ue' | 'e>i' | 'u>ue' | 'i>í' | 'u>ú'

/** 6人称分の活用形。命令法の yo のように存在しない形は null */
export type Forms = (string | null)[]

export type VerbEntry = {
  infinitive: string
  meaning_ja: string
  group: 'regular' | 'stem' | 'irregular'
  stemChange?: StemChange
  /** conocer → conozco のように a/o の前で c → zc になる */
  zc?: boolean
  /** 強変化の点過去の語幹（tener → tuv） */
  preteriteStem?: string
  /** 不規則な未来・過去未来の語幹（tener → tendr） */
  futureStem?: string
  pastParticiple?: string
  gerund?: string
  /** 規則と違う形だけを書く。null または省略した人称は自動生成した形を使う */
  irregular?: Partial<Record<SimpleTense, (string | null)[]>>
}

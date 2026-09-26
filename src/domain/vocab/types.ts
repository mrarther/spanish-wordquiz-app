export type Level = 'A1' | 'A2' | 'B1' | 'B2'

export type PartOfSpeech =
  'noun' | 'adj' | 'adv' | 'prep' | 'conj' | 'pron' | 'interr' | 'num' | 'expr'

export const POS_LABELS: Record<PartOfSpeech, string> = {
  noun: '名詞',
  adj: '形容詞',
  adv: '副詞',
  prep: '前置詞',
  conj: '接続詞',
  pron: '代名詞',
  interr: '疑問詞',
  num: '数詞',
  expr: '表現',
}

/** mf は男女同形（el/la estudiante） */
export type Gender = 'm' | 'f' | 'mf'

/** vocab/*.json の1語。id と category は読み込み時にファイルから付ける */
export type VocabEntry = {
  es: string
  ja: string
  pos: PartOfSpeech
  gender?: Gender
  level: Level
  /** 性とは違う冠詞を使う名詞（el agua, el hambre） */
  article?: string
  example?: string
}

export type VocabWord = VocabEntry & {
  id: string
  category: string
}

export type VocabCategoryFile = {
  id: string
  label_ja: string
  words: VocabEntry[]
}

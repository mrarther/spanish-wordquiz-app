import { displayEs } from '../domain/vocab/quiz'
import { POS_LABELS, type VocabWord } from '../domain/vocab/types'

/** 単語のスペイン語・意味・品詞・レベルをまとめて表示する */
export function WordDetails({ word }: { word: VocabWord }) {
  return (
    <div className="grid gap-1">
      <p className="text-xl font-semibold" lang="es">
        {displayEs(word)}
      </p>
      <p>{word.ja}</p>
      <p className="text-xs text-ink-subtle">
        {POS_LABELS[word.pos]}・{word.level}
      </p>
    </div>
  )
}

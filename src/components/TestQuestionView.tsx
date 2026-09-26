import { isCompound } from '../domain/conjugation/compound'
import { PERSON_LABELS, TENSES } from '../domain/conjugation/types'
import { SECTION_LABELS, type TestQuestion } from '../domain/test/compose'
import { ClozeSentence } from './ClozeSentence'

/** 総合テストの問題文を分野ごとに表示する。reveal なら正解を入れて表示する（結果画面用） */
export function TestQuestionView({ q, reveal }: { q: TestQuestion; reveal?: boolean }) {
  return (
    <div className="grid gap-1">
      <p className="text-xs text-gray-500">{SECTION_LABELS[q.section]}</p>
      {q.section === 'conj' && (
        <>
          <p className="text-sm text-gray-600">{TENSES[q.conj.tense].label_ja}</p>
          <p className="text-xl font-bold" lang="es">
            {q.conj.verb.infinitive}
            <span className="ml-2 text-base font-normal text-gray-600">
              {q.conj.verb.meaning_ja}
            </span>
          </p>
          <p lang="es">{PERSON_LABELS[q.conj.person]}</p>
          {isCompound(q.conj.tense) && !reveal && (
            <p className="text-xs text-gray-500">haber + 過去分詞で答えてください</p>
          )}
        </>
      )}
      {q.section === 'vocab' && (
        <>
          <p className="text-sm text-gray-600">スペイン語で言うと？</p>
          <p className="text-xl font-bold">{q.vocab.prompt}</p>
        </>
      )}
      {q.section === 'cloze' && (
        <>
          <ClozeSentence
            parsed={q.cloze.parsed}
            hint={reveal ? undefined : q.cloze.item.hint}
            reveal={reveal}
            className="text-xl"
          />
          <p className="text-sm text-gray-600">{q.cloze.item.translation_ja}</p>
        </>
      )}
    </div>
  )
}

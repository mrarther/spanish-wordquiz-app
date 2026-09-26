import { Link, Navigate, useNavigate } from 'react-router'
import { VOCAB } from '../data/vocab'
import { displayEs, generateVocabQuiz } from '../domain/vocab/quiz'
import { useVocabStore, vocabDirection, vocabQuizPath } from '../store/vocabStore'

export function VocabResult() {
  const questions = useVocabStore((s) => s.questions)
  const answers = useVocabStore((s) => s.answers)
  const setup = useVocabStore((s) => s.setup)
  const start = useVocabStore((s) => s.start)
  const navigate = useNavigate()

  if (questions.length === 0) return <Navigate to="/vocab" replace />

  const cards = setup.mode === 'cards'
  const correct = answers.filter((a) => a.correct).length
  const mistakes = answers.filter((a) => !a.correct || a.accentMistake)
  const wrong = answers.filter((a) => !a.correct).map((a) => a.question)

  const restart = (qs: typeof questions) => {
    start(qs)
    navigate(vocabQuizPath(setup.mode))
  }

  return (
    <div className="grid gap-6">
      <div className="rounded-lg border border-gray-300 p-6 text-center">
        <p className="text-sm text-gray-600">{cards ? 'わかった単語' : '結果'}</p>
        <p className="text-4xl font-bold">
          {correct} / {answers.length}
        </p>
        <p className="text-gray-600">
          {cards ? '' : '正答率 '}
          {answers.length ? Math.round((correct / answers.length) * 100) : 0}%
        </p>
      </div>

      {mistakes.length > 0 && (
        <section className="grid gap-2">
          <h2 className="font-semibold">
            {cards ? 'まだ覚えていない単語' : '間違えた単語・アクセントの注意'}
          </h2>
          <ul className="grid gap-2">
            {mistakes.map(({ question: q, given, correct }) => (
              <li key={q.id} className="rounded-md border border-gray-200 p-3 text-sm">
                <p>
                  <span className="font-semibold" lang="es">
                    {displayEs(q.word)}
                  </span>
                  <span className="mx-2">…</span>
                  {q.word.ja}
                </p>
                {given && (
                  <p className="text-gray-600">
                    あなたの答え：
                    <span className={correct ? 'text-amber-700' : 'text-red-600'}>{given}</span>
                  </p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="grid gap-2">
        {wrong.length > 0 && (
          <button
            type="button"
            onClick={() => restart(wrong)}
            className="rounded-md bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700"
          >
            {cards ? 'まだの単語をもう一度' : '間違えた単語をもう一度'}（{wrong.length}語）
          </button>
        )}
        <button
          type="button"
          onClick={() =>
            restart(generateVocabQuiz(VOCAB, { ...setup, direction: vocabDirection(setup) }))
          }
          className="rounded-md border border-blue-600 px-4 py-3 font-semibold text-blue-700 hover:bg-blue-50"
        >
          同じ設定で新しい単語
        </button>
        <Link to="/vocab" className="text-center text-sm text-blue-700 underline">
          設定を変える
        </Link>
      </div>
    </div>
  )
}

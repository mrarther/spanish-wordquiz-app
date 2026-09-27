import { Link, Navigate, useNavigate } from 'react-router'
import { displayEs } from '../domain/vocab/quiz'
import { startVocabQuiz, useVocabStore, vocabQuizPath } from '../store/vocabStore'

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
      <div className="rounded-lg border border-line p-6 text-center">
        <p className="text-sm text-ink-muted">{cards ? 'わかった単語' : '結果'}</p>
        <p className="text-4xl font-bold">
          {correct} / {answers.length}
        </p>
        <p className="text-ink-muted">
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
              <li key={q.id} className="rounded-md border border-line-soft p-3 text-sm">
                <p>
                  <span className="font-semibold" lang="es">
                    {displayEs(q.word)}
                  </span>
                  <span className="mx-2">…</span>
                  {q.word.ja}
                </p>
                {given && (
                  <p className="text-ink-muted">
                    あなたの答え：
                    <span className={correct ? 'text-warning' : 'text-danger'}>{given}</span>
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
          onClick={async () => {
            await startVocabQuiz(setup)
            navigate(vocabQuizPath(setup.mode))
          }}
          className="rounded-md border border-blue-600 px-4 py-3 font-semibold text-link hover:bg-accent-soft"
        >
          同じ設定で新しい単語
        </button>
        <Link to="/vocab" className="text-center text-sm text-link underline">
          設定を変える
        </Link>
      </div>
    </div>
  )
}

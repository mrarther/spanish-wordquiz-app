import { Link, Navigate, useNavigate } from 'react-router'
import { ClozeSentence } from '../components/ClozeSentence'
import { startClozeQuiz, useClozeStore } from '../store/clozeStore'

export function ClozeResult() {
  const questions = useClozeStore((s) => s.questions)
  const answers = useClozeStore((s) => s.answers)
  const setup = useClozeStore((s) => s.setup)
  const start = useClozeStore((s) => s.start)
  const navigate = useNavigate()

  if (questions.length === 0) return <Navigate to="/cloze" replace />

  const correct = answers.filter((a) => a.correct).length
  const mistakes = answers.filter((a) => !a.correct || a.accentMistake)
  const wrong = answers.filter((a) => !a.correct).map((a) => a.question)

  return (
    <div className="grid gap-6">
      <div className="rounded-lg border border-gray-300 p-6 text-center">
        <p className="text-sm text-gray-600">結果</p>
        <p className="text-4xl font-bold">
          {correct} / {answers.length}
        </p>
        <p className="text-gray-600">
          正答率 {answers.length ? Math.round((correct / answers.length) * 100) : 0}%
        </p>
      </div>

      {mistakes.length > 0 && (
        <section className="grid gap-2">
          <h2 className="font-semibold">間違えた問題・アクセントの注意</h2>
          <ul className="grid gap-2">
            {mistakes.map(({ question: q, given, correct }) => (
              <li key={q.id} className="grid gap-1 rounded-md border border-gray-200 p-3 text-sm">
                <ClozeSentence parsed={q.parsed} reveal />
                <p className="text-gray-600">{q.item.translation_ja}</p>
                <p lang="es">
                  あなたの答え：
                  <span className={correct ? 'text-amber-700' : 'text-red-600'}>{given}</span>
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="grid gap-2">
        {wrong.length > 0 && (
          <button
            type="button"
            onClick={() => {
              start(wrong)
              navigate('/cloze/quiz')
            }}
            className="rounded-md bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700"
          >
            間違えた問題をもう一度（{wrong.length}問）
          </button>
        )}
        <button
          type="button"
          onClick={async () => {
            await startClozeQuiz(setup)
            navigate('/cloze/quiz')
          }}
          className="rounded-md border border-blue-600 px-4 py-3 font-semibold text-blue-700 hover:bg-blue-50"
        >
          同じ設定で新しい問題
        </button>
        <Link to="/cloze" className="text-center text-sm text-blue-700 underline">
          設定を変える
        </Link>
      </div>
    </div>
  )
}

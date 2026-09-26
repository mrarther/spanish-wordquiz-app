import { Link, Navigate, useNavigate } from 'react-router'
import { TestQuestionView } from '../components/TestQuestionView'
import { displayAnswer } from '../domain/test/display'
import { SECTION_LABELS, TEST_SECTIONS } from '../domain/test/compose'
import { percent } from '../domain/test/score'
import { startTest, useTestStore } from '../store/testStore'
import { formatTime } from '../utils/time'

export function TestResult() {
  const score = useTestStore((s) => s.score)
  const timedOut = useTestStore((s) => s.timedOut)
  const startedAt = useTestStore((s) => s.startedAt)
  const setup = useTestStore((s) => s.setup)
  const navigate = useNavigate()

  const finishedAt = useTestStore((s) => s.finishedAt)
  if (!score) return <Navigate to="/test" replace />

  const wrong = score.results.filter((r) => !r.correct)

  return (
    <div className="grid gap-6">
      <div className="rounded-lg border border-gray-300 p-6 text-center">
        <p className="text-sm text-gray-600">総合テストの結果</p>
        <p className="text-4xl font-bold">
          {score.correct} / {score.total}
        </p>
        <p className="text-gray-600">正答率 {percent(score)}%</p>
        <p className="text-sm text-gray-600">所要時間 {formatTime(finishedAt - startedAt)}</p>
        {timedOut && (
          <p className="mt-2 text-sm font-semibold text-red-600">時間切れで自動的に採点しました</p>
        )}
      </div>

      <section className="grid gap-2">
        <h2 className="font-semibold">分野別</h2>
        <ul className="grid gap-2">
          {TEST_SECTIONS.filter((s) => score.bySection[s].total > 0).map((s) => {
            const sec = score.bySection[s]
            return (
              <li key={s} className="grid gap-1">
                <div className="flex justify-between text-sm">
                  <span>{SECTION_LABELS[s]}</span>
                  <span>
                    {sec.correct} / {sec.total}（{percent(sec)}%）
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                  <div className="h-full bg-green-600" style={{ width: `${percent(sec)}%` }} />
                </div>
              </li>
            )
          })}
        </ul>
      </section>

      {wrong.length > 0 && (
        <section className="grid gap-2">
          <h2 className="font-semibold">間違えた問題・未回答（{wrong.length}問）</h2>
          <ul className="grid gap-2">
            {wrong.map((r) => (
              <li
                key={r.question.id}
                className="grid gap-2 rounded-md border border-gray-200 p-3 text-sm"
              >
                <TestQuestionView q={r.question} reveal />
                <p lang="es">
                  あなたの答え：
                  <span className="text-red-600">
                    {r.answered ? displayAnswer(r.question, r.given) : '（未回答）'}
                  </span>
                  <span className="mx-2">→</span>
                  正解：
                  <span className="font-semibold text-green-700">
                    {displayAnswer(r.question, r.question.answer)}
                  </span>
                </p>
              </li>
            ))}
          </ul>
          <p className="text-xs text-gray-500">
            回答した問題は復習の記録に入ります。間違えた問題は「復習」から解き直せます。
          </p>
        </section>
      )}

      <div className="grid gap-2">
        <button
          type="button"
          onClick={() => {
            startTest(setup)
            navigate('/test/run')
          }}
          className="rounded-md bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700"
        >
          同じ範囲でもう一度
        </button>
        <Link to="/review" className="text-center text-sm text-blue-700 underline">
          復習へ
        </Link>
        <Link to="/test" className="text-center text-sm text-blue-700 underline">
          設定を変える
        </Link>
      </div>
    </div>
  )
}

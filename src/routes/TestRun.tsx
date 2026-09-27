import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router'
import { AnswerInput } from '../components/AnswerInput'
import { ChoiceGrid } from '../components/ChoiceGrid'
import { useAutoSpeak } from '../components/useSpeech'
import { TestQuestionView } from '../components/TestQuestionView'
import { displayAnswer, isNegativeImperative } from '../domain/test/display'
import { useTestStore } from '../store/testStore'
import { formatTime } from '../utils/time'

export function TestRun() {
  const questions = useTestStore((s) => s.questions)
  const choices = useTestStore((s) => s.choices)
  const answers = useTestStore((s) => s.answers)
  const deadline = useTestStore((s) => s.deadline)
  const score = useTestStore((s) => s.score)
  const format = useTestStore((s) => s.setup.format)
  const answer = useTestStore((s) => s.answer)
  const finish = useTestStore((s) => s.finish)
  const navigate = useNavigate()

  const [index, setIndex] = useState(0)

  // 読み上げ：活用問題の動詞の原形だけ（ほかの問題は答えが分かってしまうので読まない）
  const current = questions[index]
  useAutoSpeak(current?.section === 'conj' ? current.conj.verb.infinitive : null, current?.id ?? '')
  const [now, setNow] = useState(() => Date.now())

  // 制限時間があれば1秒ごとに残り時間を更新し、時間切れで自動的に採点する
  useEffect(() => {
    if (!deadline || score) return
    const timer = setInterval(() => {
      const t = Date.now()
      setNow(t)
      if (t >= deadline) {
        clearInterval(timer)
        finish({ timedOut: true, now: t }).then(() => navigate('/test/result'))
      }
    }, 1000)
    return () => clearInterval(timer)
  }, [deadline, score, finish, navigate])

  if (questions.length === 0) return <Navigate to="/test" replace />
  if (score) return <Navigate to="/test/result" replace />

  const q = questions[index]
  const unanswered = questions.filter((x) => !answers[x.id]?.trim()).length
  const isLast = index === questions.length - 1
  const remaining = deadline ? deadline - now : null

  const submitAll = () => {
    if (unanswered > 0 && !window.confirm(`未回答が ${unanswered} 問あります。採点しますか？`))
      return
    finish({ timedOut: false, now: Date.now() }).then(() => navigate('/test/result'))
  }

  return (
    <div className="grid gap-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-ink-muted">
          問題 {index + 1} / {questions.length}
          <span className="ml-2">（未回答 {unanswered}）</span>
        </p>
        {remaining !== null && (
          <p
            className={`font-mono text-lg font-semibold ${remaining < 60_000 ? 'text-danger' : ''}`}
            aria-label="残り時間"
          >
            {formatTime(remaining)}
          </p>
        )}
      </div>

      <div className="rounded-lg border border-line p-4">
        <TestQuestionView q={q} />
      </div>

      {format === 'input' ? (
        <AnswerInput
          key={q.id}
          value={answers[q.id] ?? ''}
          onChange={(v) => answer(q.id, v)}
          onSubmit={() => !isLast && setIndex(index + 1)}
          prefix={isNegativeImperative(q) ? 'no' : undefined}
          submitLabel={isLast ? '入力を確定' : '次の問題へ（Enter）'}
        />
      ) : (
        <ChoiceGrid
          choices={choices[q.id] ?? []}
          onSelect={(c) => answer(q.id, c)}
          state={(c) => (answers[q.id] === c ? 'selected' : 'idle')}
          lang="es"
          format={(c) => displayAnswer(q, c)}
        />
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setIndex(index - 1)}
          disabled={index === 0}
          className="flex-1 rounded-md border border-line px-4 py-2 hover:bg-surface-muted disabled:opacity-40"
        >
          前へ
        </button>
        <button
          type="button"
          onClick={() => setIndex(index + 1)}
          disabled={isLast}
          className="flex-1 rounded-md border border-line px-4 py-2 hover:bg-surface-muted disabled:opacity-40"
        >
          次へ
        </button>
      </div>

      <nav className="flex flex-wrap gap-1" aria-label="問題の一覧">
        {questions.map((x, i) => (
          <button
            key={x.id}
            type="button"
            onClick={() => setIndex(i)}
            aria-label={`問題 ${i + 1}${answers[x.id]?.trim() ? '（回答済み）' : ''}`}
            aria-current={i === index}
            className={`h-8 w-8 rounded text-xs ${
              i === index
                ? 'bg-blue-600 text-white'
                : answers[x.id]?.trim()
                  ? 'bg-accent-muted'
                  : 'border border-line bg-surface'
            }`}
          >
            {i + 1}
          </button>
        ))}
      </nav>

      <button
        type="button"
        onClick={submitAll}
        className="rounded-md bg-green-600 px-4 py-3 font-semibold text-white hover:bg-green-700"
      >
        採点する
      </button>
    </div>
  )
}

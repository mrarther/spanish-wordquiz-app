import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router'
import { ProgressBar } from '../components/ProgressBar'
import { SpeakButton } from '../components/SpeakButton'
import { useAutoSpeak } from '../components/useSpeech'
import { WordDetails } from '../components/WordDetails'
import { displayEs } from '../domain/vocab/quiz'
import { useVocabStore } from '../store/vocabStore'

export function Flashcards() {
  const questions = useVocabStore((s) => s.questions)
  const answers = useVocabStore((s) => s.answers)
  const record = useVocabStore((s) => s.record)
  const navigate = useNavigate()
  const [flipped, setFlipped] = useState(false)

  const question = questions[answers.length]

  // 読み上げ：スペイン語の面が見えたとき（西→日は表、日→西はめくったとき）
  const spanish = question && displayEs(question.word)
  const spanishSide = question?.direction === 'es-ja' ? !flipped : flipped
  useAutoSpeak(spanishSide ? spanish : null, `${question?.id}:${flipped}`)

  const judge = (known: boolean) => {
    if (!question) return
    record({ question, given: '', correct: known, accentMistake: false })
    setFlipped(false)
    if (answers.length + 1 === questions.length) navigate('/vocab/result')
  }

  // Space でめくる。めくった後は ← で「まだ」、→ で「わかった」
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        e.preventDefault()
        setFlipped((f) => !f)
      } else if (flipped && e.key === 'ArrowLeft') judge(false)
      else if (flipped && e.key === 'ArrowRight') judge(true)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  if (questions.length === 0) return <Navigate to="/vocab" replace />
  if (!question) return <Navigate to="/vocab/result" replace />

  return (
    <div className="grid gap-6">
      <ProgressBar current={answers.length} total={questions.length} />

      <button
        type="button"
        onClick={() => setFlipped((f) => !f)}
        className="grid min-h-56 place-items-center rounded-xl border border-line bg-surface p-6 text-center shadow-sm hover:bg-surface-muted"
        aria-label={flipped ? 'カードの表に戻す' : 'カードをめくる'}
      >
        {flipped ? (
          <WordDetails word={question.word} />
        ) : (
          <div className="grid gap-2">
            <p className="text-3xl font-bold" lang={question.direction === 'es-ja' ? 'es' : 'ja'}>
              {question.prompt}
            </p>
            <p className="text-xs text-ink-subtle">タップまたは Space でめくる</p>
          </div>
        )}
      </button>

      {/* 日→西では、めくるまでボタンを出さない（答えが分かってしまうため） */}
      {spanish && (question.direction === 'es-ja' || flipped) && (
        <div className="-mt-4 text-center">
          <SpeakButton text={spanish} />
        </div>
      )}

      {flipped && (
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => judge(false)}
            className="rounded-md border border-line px-4 py-3 font-semibold hover:bg-surface-muted"
          >
            まだ（←）
          </button>
          <button
            type="button"
            onClick={() => judge(true)}
            className="rounded-md bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700"
          >
            わかった（→）
          </button>
        </div>
      )}
    </div>
  )
}

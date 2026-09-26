import { useEffect, useMemo, useState } from 'react'
import { Navigate, useNavigate } from 'react-router'
import { AnswerInput } from '../components/AnswerInput'
import { ProgressBar } from '../components/ProgressBar'
import { WordDetails } from '../components/WordDetails'
import { VOCAB } from '../data/vocab'
import { checkAnswer, type CheckResult } from '../domain/quiz/answerCheck'
import { vocabChoices } from '../domain/vocab/quiz'
import { useVocabStore } from '../store/vocabStore'

export function VocabQuiz() {
  const questions = useVocabStore((s) => s.questions)
  const answers = useVocabStore((s) => s.answers)
  const { mode, accentMode } = useVocabStore((s) => s.setup)
  const record = useVocabStore((s) => s.record)
  const navigate = useNavigate()

  const [input, setInput] = useState('')
  const [result, setResult] = useState<CheckResult | null>(null)

  // 回答直後は結果を表示するため、1つ前の問題を指す
  const index = result ? answers.length - 1 : answers.length
  const question = questions[index]
  const choices = useMemo(
    () => (question && mode === 'choice' ? vocabChoices(question, VOCAB) : []),
    [question, mode],
  )
  const isLast = index === questions.length - 1

  const next = () => {
    if (isLast) {
      navigate('/vocab/result')
      return
    }
    setInput('')
    setResult(null)
  }

  useEffect(() => {
    if (!result) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        next()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  if (questions.length === 0) return <Navigate to="/vocab" replace />
  if (!question) return <Navigate to="/vocab/result" replace />

  const submit = (given: string) => {
    if (result || given.trim() === '') return
    const r = checkAnswer(given, question.accepted, mode === 'choice' ? 'strict' : accentMode)
    setInput(given)
    setResult(r)
    record({ question, given, ...r })
  }

  const promptLang = question.direction === 'es-ja' ? 'es' : 'ja'
  const choiceLang = question.direction === 'es-ja' ? 'ja' : 'es'

  return (
    <div className="grid gap-6">
      <ProgressBar current={answers.length} total={questions.length} />

      <div className="grid gap-1 rounded-lg border border-gray-300 p-4">
        <p className="text-sm text-gray-600">
          {question.direction === 'es-ja' ? '意味は？' : 'スペイン語で言うと？'}
        </p>
        <p className="text-2xl font-bold" lang={promptLang}>
          {question.prompt}
        </p>
      </div>

      {mode === 'spelling' ? (
        <AnswerInput
          value={input}
          onChange={setInput}
          onSubmit={() => submit(input)}
          disabled={!!result}
        />
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {choices.map((c) => {
            const chosen = result && c === input
            const isAnswer = result && c === question.answer
            return (
              <button
                key={c}
                type="button"
                disabled={!!result}
                onClick={() => submit(c)}
                lang={choiceLang}
                className={`rounded-md border px-3 py-3 ${
                  isAnswer
                    ? 'border-green-600 bg-green-50'
                    : chosen
                      ? 'border-red-600 bg-red-50'
                      : 'border-gray-300 bg-white hover:bg-gray-100'
                }`}
              >
                {c}
              </button>
            )
          })}
        </div>
      )}

      {result && (
        <div
          className={`grid gap-3 rounded-lg p-4 ${result.correct ? 'bg-green-50' : 'bg-red-50'}`}
          role="status"
        >
          <p className="font-bold">
            {result.correct ? '正解！' : '不正解'}
            {result.accentMistake && (
              <span className="ml-2 text-sm font-normal text-amber-700">アクセント記号に注意</span>
            )}
          </p>
          <WordDetails word={question.word} />
          <button
            type="button"
            onClick={next}
            className="justify-self-start rounded-md bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
          >
            {isLast ? '結果を見る' : '次へ'}（Enter）
          </button>
        </div>
      )}
    </div>
  )
}

import { useEffect, useMemo, useState } from 'react'
import { Navigate, useNavigate } from 'react-router'
import { AnswerInput } from '../components/AnswerInput'
import { ClozeSentence } from '../components/ClozeSentence'
import { ProgressBar } from '../components/ProgressBar'
import { VERBS } from '../data/verbs'
import { VOCAB } from '../data/vocab'
import { clozeChoices } from '../domain/cloze/quiz'
import { CLOZE_KIND_LABELS } from '../domain/cloze/types'
import { checkAnswer, type CheckResult } from '../domain/quiz/answerCheck'
import { allClozeItems, useClozeStore } from '../store/clozeStore'

export function ClozeQuiz() {
  const questions = useClozeStore((s) => s.questions)
  const answers = useClozeStore((s) => s.answers)
  const customItems = useClozeStore((s) => s.customItems)
  const { format, accentMode } = useClozeStore((s) => s.setup)
  const record = useClozeStore((s) => s.record)
  const navigate = useNavigate()

  const [input, setInput] = useState('')
  const [result, setResult] = useState<CheckResult | null>(null)

  // 回答直後は結果を表示するため、1つ前の問題を指す
  const index = result ? answers.length - 1 : answers.length
  const question = questions[index]
  const choices = useMemo(
    () =>
      question && format === 'choice'
        ? clozeChoices(question, allClozeItems(customItems), { verbs: VERBS, vocab: VOCAB })
        : [],
    [question, format, customItems],
  )
  const isLast = index === questions.length - 1

  const next = () => {
    if (isLast) {
      navigate('/cloze/result')
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

  if (questions.length === 0) return <Navigate to="/cloze" replace />
  if (!question) return <Navigate to="/cloze/result" replace />

  const submit = (given: string) => {
    if (result || given.trim() === '') return
    const r = checkAnswer(given, question.accepted, format === 'choice' ? 'strict' : accentMode)
    setInput(given)
    setResult(r)
    record({ question, given, ...r })
  }

  const { item, parsed } = question

  return (
    <div className="grid gap-6">
      <ProgressBar current={answers.length} total={questions.length} />

      <div className="grid gap-2 rounded-lg border border-gray-300 p-4">
        <p className="text-sm text-gray-600">
          {CLOZE_KIND_LABELS[item.kind]}・{item.level}
          {item.source === 'custom' && '・自作'}
        </p>
        <ClozeSentence parsed={parsed} hint={item.hint} reveal={!!result} className="text-xl" />
        <p className="text-sm text-gray-600">{item.translation_ja}</p>
      </div>

      {format === 'input' ? (
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
                lang="es"
                className={`rounded-md border px-3 py-3 text-lg ${
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
          className={`grid gap-2 rounded-lg p-4 ${result.correct ? 'bg-green-50' : 'bg-red-50'}`}
          role="status"
        >
          <p className="font-bold">
            {result.correct ? '正解！' : '不正解'}
            {result.accentMistake && (
              <span className="ml-2 text-sm font-normal text-amber-700">アクセント記号に注意</span>
            )}
          </p>
          {(!result.correct || result.accentMistake) && (
            <p lang="es">
              正解：<span className="font-semibold">{question.answer}</span>
              {item.alternatives?.length ? `（別解：${item.alternatives.join('、')}）` : ''}
            </p>
          )}
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

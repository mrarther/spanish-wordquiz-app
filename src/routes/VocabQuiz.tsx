import { useEffect, useMemo, useState } from 'react'
import { Navigate, useNavigate } from 'react-router'
import { AnswerInput } from '../components/AnswerInput'
import { ChoiceGrid } from '../components/ChoiceGrid'
import { ProgressBar } from '../components/ProgressBar'
import { SpeakButton } from '../components/SpeakButton'
import { useAutoSpeak } from '../components/useSpeech'
import { WordDetails } from '../components/WordDetails'
import { VOCAB } from '../data/vocab'
import { checkAnswer, type CheckResult } from '../domain/quiz/answerCheck'
import { displayEs, vocabChoices } from '../domain/vocab/quiz'
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

  // 読み上げ：西→日は表示時に単語、日→西は回答後に単語（答えを先に明かさない）
  const spanish = question && displayEs(question.word)
  const spokenNow = question?.direction === 'es-ja' ? !result : !!result
  useAutoSpeak(spokenNow ? spanish : null, `${question?.id}:${result ? 'answer' : 'question'}`)

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

      <div className="grid gap-1 rounded-lg border border-line p-4">
        <p className="text-sm text-ink-muted">
          {question.direction === 'es-ja' ? '意味は？' : 'スペイン語で言うと？'}
        </p>
        <p className="text-2xl font-bold" lang={promptLang}>
          {question.prompt}
          {question.direction === 'es-ja' && <SpeakButton text={spanish!} />}
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
        <ChoiceGrid
          choices={choices}
          onSelect={submit}
          disabled={!!result}
          state={(c) =>
            !result ? 'idle' : c === question.answer ? 'correct' : c === input ? 'wrong' : 'idle'
          }
          lang={choiceLang}
        />
      )}

      {result && (
        <div
          className={`grid gap-3 rounded-lg p-4 ${result.correct ? 'bg-success-soft' : 'bg-danger-soft'}`}
          role="status"
        >
          <p className="font-bold">
            {result.correct ? '正解！' : '不正解'}
            {result.accentMistake && (
              <span className="ml-2 text-sm font-normal text-warning">アクセント記号に注意</span>
            )}
          </p>
          <div className="flex items-start gap-1">
            <WordDetails word={question.word} />
            <SpeakButton text={spanish!} />
          </div>
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

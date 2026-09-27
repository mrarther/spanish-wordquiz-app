import { useEffect, useMemo, useState } from 'react'
import { Navigate, useNavigate } from 'react-router'
import { AnswerInput } from '../components/AnswerInput'
import { ChoiceGrid } from '../components/ChoiceGrid'
import { ProgressBar } from '../components/ProgressBar'
import { SpeakButton } from '../components/SpeakButton'
import { useAutoSpeak } from '../components/useSpeech'
import { isCompound } from '../domain/conjugation/compound'
import { PERSON_LABELS, TENSES } from '../domain/conjugation/types'
import { checkAnswer, type CheckResult } from '../domain/quiz/answerCheck'
import { conjugationChoices } from '../domain/quiz/distractors'
import { useConjugationStore } from '../store/conjugationStore'

export function ConjugationQuiz() {
  const questions = useConjugationStore((s) => s.questions)
  const answers = useConjugationStore((s) => s.answers)
  const { format, accentMode } = useConjugationStore((s) => s.setup)
  const record = useConjugationStore((s) => s.record)
  const navigate = useNavigate()

  const [input, setInput] = useState('')
  const [result, setResult] = useState<CheckResult | null>(null)

  // 回答済みの数が、いま解いている問題の番号になる。回答直後は結果を表示するため1つ前を指す
  const index = result ? answers.length - 1 : answers.length
  const question = questions[index]
  const choices = useMemo(
    () => (question && format === 'choice' ? conjugationChoices(question) : []),
    [question, format],
  )
  const isLast = index === questions.length - 1

  // 読み上げ：表示時は動詞の原形、回答後は正解（命令法の否定は "no" 付き）
  const answerText =
    question &&
    (question.tense === 'imperativeNegative' ? `no ${question.answer}` : question.answer)
  useAutoSpeak(
    question && (result ? answerText : question.verb.infinitive),
    `${question?.id}:${result ? 'answer' : 'question'}`,
  )

  const next = () => {
    if (isLast) {
      navigate('/conjugation/result')
      return
    }
    setInput('')
    setResult(null)
  }

  // 結果表示中は Enter で次へ進む
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

  if (questions.length === 0) return <Navigate to="/conjugation" replace />
  if (!question) return <Navigate to="/conjugation/result" replace />

  const submit = (given: string) => {
    if (result || given.trim() === '') return
    const r = checkAnswer(given, question.accepted, format === 'choice' ? 'strict' : accentMode)
    setInput(given)
    setResult(r)
    record({ question, given, ...r })
  }

  const { verb, tense, person } = question
  const negative = tense === 'imperativeNegative'

  return (
    <div className="grid gap-6">
      <ProgressBar current={answers.length} total={questions.length} />

      <div className="grid gap-2 rounded-lg border border-line p-4">
        <p className="text-sm text-ink-muted">{TENSES[tense].label_ja}</p>
        <p className="text-2xl font-bold" lang="es">
          {verb.infinitive}
          <SpeakButton text={verb.infinitive} />
          <span className="ml-2 text-base font-normal text-ink-muted">{verb.meaning_ja}</span>
        </p>
        <p className="text-lg" lang="es">
          {PERSON_LABELS[person]}
        </p>
        {isCompound(tense) && (
          <p className="text-xs text-ink-subtle">
            haber + 過去分詞で答えてください（例：he hablado）
          </p>
        )}
      </div>

      {format === 'input' ? (
        <AnswerInput
          value={input}
          onChange={setInput}
          onSubmit={() => submit(input)}
          disabled={!!result}
          prefix={negative ? 'no' : undefined}
        />
      ) : (
        <ChoiceGrid
          choices={choices}
          onSelect={submit}
          disabled={!!result}
          state={(c) =>
            !result ? 'idle' : c === question.answer ? 'correct' : c === input ? 'wrong' : 'idle'
          }
          lang="es"
          format={(c) => (negative ? `no ${c}` : c)}
          large
        />
      )}

      {result && (
        <div
          className={`grid gap-2 rounded-lg p-4 ${result.correct ? 'bg-success-soft' : 'bg-danger-soft'}`}
          role="status"
        >
          <p className="font-bold">
            {result.correct ? '正解！' : '不正解'}
            {result.accentMistake && (
              <span className="ml-2 text-sm font-normal text-warning">アクセント記号に注意</span>
            )}
            <SpeakButton text={answerText!} />
          </p>
          {(!result.correct || result.accentMistake) && (
            <p lang="es">
              正解：
              <span className="font-semibold">{answerText}</span>
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

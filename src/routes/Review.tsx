import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { VERBS } from '../data/verbs'
import { VOCAB } from '../data/vocab'
import { getDueItems } from '../db/progress'
import {
  clozeQuestionsFromItems,
  conjQuestionsFromItems,
  vocabWordsFromItems,
} from '../domain/srs/review'
import { makeVocabQuestion } from '../domain/vocab/quiz'
import { allClozeItems, useClozeStore } from '../store/clozeStore'
import { useConjugationStore } from '../store/conjugationStore'
import { useVocabStore, vocabDirection, vocabQuizPath } from '../store/vocabStore'
import { shuffle } from '../utils/random'

type Due = { conj: string[]; vocab: string[]; cloze: string[] }

export function Review() {
  const [due, setDue] = useState<Due | null>(null)
  const [error, setError] = useState(false)
  const conjSetup = useConjugationStore((s) => s.setup)
  const startConj = useConjugationStore((s) => s.start)
  const vocabSetup = useVocabStore((s) => s.setup)
  const startVocab = useVocabStore((s) => s.start)
  const clozeSetup = useClozeStore((s) => s.setup)
  const clozeCustom = useClozeStore((s) => s.customItems)
  const startCloze = useClozeStore((s) => s.start)
  const navigate = useNavigate()

  useEffect(() => {
    Promise.all([getDueItems('conj'), getDueItems('vocab'), getDueItems('cloze')])
      .then(([conj, vocab, cloze]) =>
        setDue({
          conj: conj.map((r) => r.itemId),
          vocab: vocab.map((r) => r.itemId),
          cloze: cloze.map((r) => r.itemId),
        }),
      )
      .catch((e) => {
        console.error(e)
        setError(true)
      })
  }, [])

  if (error) return <p className="text-red-600">学習記録を読み込めませんでした。</p>
  if (!due) return <p className="text-gray-600">読み込み中…</p>

  // 期限切れの古い順に1回分の問題数だけ取り出し、出題順はシャッフルする
  const reviewConj = () => {
    const ids = due.conj.slice(0, conjSetup.count)
    startConj(shuffle(conjQuestionsFromItems(ids, VERBS)))
    navigate('/conjugation/quiz')
  }
  const reviewVocab = () => {
    const words = vocabWordsFromItems(due.vocab.slice(0, vocabSetup.count), VOCAB)
    const direction = vocabDirection(vocabSetup)
    startVocab(shuffle(words.map((w) => makeVocabQuestion(w, direction, VOCAB))))
    navigate(vocabQuizPath(vocabSetup.mode))
  }

  const reviewCloze = () => {
    const items = allClozeItems(clozeCustom)
    startCloze(shuffle(clozeQuestionsFromItems(due.cloze.slice(0, clozeSetup.count), items)))
    navigate('/cloze/quiz')
  }

  const nothingDue = due.conj.length + due.vocab.length + due.cloze.length === 0

  return (
    <div className="grid gap-6">
      <h2 className="text-xl font-bold">復習</h2>
      <p className="text-sm text-gray-600">
        間違えた問題や、覚えてから時間がたった問題を、忘れる前に出題します。
        1回の問題数と出題形式は、それぞれの設定画面の設定を使います。
      </p>

      <ReviewCard
        title="活用"
        count={due.conj.length}
        onStart={reviewConj}
        settingsPath="/conjugation"
      />
      <ReviewCard
        title="語彙"
        count={due.vocab.length}
        onStart={reviewVocab}
        settingsPath="/vocab"
      />
      <ReviewCard
        title="例文穴埋め"
        count={due.cloze.length}
        onStart={reviewCloze}
        settingsPath="/cloze"
      />

      {nothingDue && (
        <p className="rounded-lg bg-green-50 p-4 text-sm">
          今は復習する問題がありません。新しい問題に挑戦しましょう。
        </p>
      )}
    </div>
  )
}

function ReviewCard(props: {
  title: string
  count: number
  onStart: () => void
  settingsPath: string
}) {
  return (
    <section className="grid gap-3 rounded-lg border border-gray-300 p-4">
      <div className="flex items-baseline justify-between">
        <h3 className="font-semibold">{props.title}</h3>
        <p>
          <span className="text-2xl font-bold">{props.count}</span>
          <span className="ml-1 text-sm text-gray-600">問</span>
        </p>
      </div>
      <button
        type="button"
        onClick={props.onStart}
        disabled={props.count === 0}
        className="rounded-md bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-40"
      >
        復習を始める
      </button>
      <Link to={props.settingsPath} className="text-center text-sm text-blue-700 underline">
        出題形式を変える
      </Link>
    </section>
  )
}

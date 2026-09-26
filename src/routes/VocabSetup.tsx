import { useNavigate } from 'react-router'
import { Chip, Radio, Section } from '../components/FormControls'
import { VOCAB, VOCAB_CATEGORIES } from '../data/vocab'
import { filterVocab, generateVocabQuiz } from '../domain/vocab/quiz'
import type { Level } from '../domain/vocab/types'
import {
  useVocabStore,
  vocabDirection,
  vocabQuizPath,
  type VocabSetup as Setup,
} from '../store/vocabStore'
import { toggle } from '../utils/list'

const LEVELS: Level[] = ['A1', 'A2']
const COUNTS = [10, 20, 30, 50]

export function VocabSetup() {
  const setup = useVocabStore((s) => s.setup)
  const updateSetup = useVocabStore((s) => s.updateSetup)
  const start = useVocabStore((s) => s.start)
  const navigate = useNavigate()

  const poolSize = filterVocab(VOCAB, setup).length
  const allSelected = setup.categories.length === VOCAB_CATEGORIES.length

  const begin = () => {
    start(generateVocabQuiz(VOCAB, { ...setup, direction: vocabDirection(setup) }))
    navigate(vocabQuizPath(setup.mode))
  }

  return (
    <div className="grid gap-6">
      <h2 className="text-xl font-bold">語彙学習の設定</h2>

      <Section title="学習方法">
        <Radio<Setup['mode']>
          value={setup.mode}
          onChange={(mode) => updateSetup({ mode })}
          options={[
            { value: 'cards', label: '単語カード' },
            { value: 'choice', label: '4択' },
            { value: 'spelling', label: 'スペル入力' },
          ]}
        />
      </Section>

      {setup.mode === 'spelling' ? (
        <p className="text-sm text-gray-600">
          意味を見て、スペイン語を入力します。名詞は冠詞（el / la）があってもなくても正解です。
        </p>
      ) : (
        <Section title="出題の向き">
          <Radio<Setup['direction']>
            value={setup.direction}
            onChange={(direction) => updateSetup({ direction })}
            options={[
              { value: 'es-ja', label: 'スペイン語 → 日本語' },
              { value: 'ja-es', label: '日本語 → スペイン語' },
            ]}
          />
        </Section>
      )}

      {setup.mode === 'spelling' && (
        <Section title="アクセント記号">
          <Radio<Setup['accentMode']>
            value={setup.accentMode}
            onChange={(accentMode) => updateSetup({ accentMode })}
            options={[
              { value: 'lenient', label: 'ゆるめ（違いは注意だけ）' },
              { value: 'strict', label: '厳密' },
            ]}
          />
        </Section>
      )}

      <Section title="カテゴリ">
        <div className="flex flex-wrap gap-2">
          <Chip
            checked={allSelected}
            onChange={() =>
              updateSetup({ categories: allSelected ? [] : VOCAB_CATEGORIES.map((c) => c.id) })
            }
            label="すべて"
          />
          {VOCAB_CATEGORIES.map((c) => (
            <Chip
              key={c.id}
              checked={setup.categories.includes(c.id)}
              onChange={() => updateSetup({ categories: toggle(setup.categories, c.id) })}
              label={`${c.label_ja}（${c.count}）`}
            />
          ))}
        </div>
      </Section>

      <Section title="レベル">
        <div className="flex flex-wrap gap-2">
          {LEVELS.map((level) => (
            <Chip
              key={level}
              checked={setup.levels.includes(level)}
              onChange={() => updateSetup({ levels: toggle(setup.levels, level) })}
              label={level}
            />
          ))}
        </div>
      </Section>

      <Section title="問題数">
        <Radio<number>
          value={setup.count}
          onChange={(count) => updateSetup({ count })}
          options={COUNTS.map((c) => ({ value: c, label: `${c}語` }))}
        />
      </Section>

      <div className="grid gap-2">
        {poolSize === 0 ? (
          <p className="text-sm text-red-600">カテゴリとレベルを1つ以上選んでください。</p>
        ) : (
          poolSize < setup.count && (
            <p className="text-sm text-gray-600">
              条件に合う単語が {poolSize} 語なので、全て出題します。
            </p>
          )
        )}
        <button
          type="button"
          onClick={begin}
          disabled={poolSize === 0}
          className="rounded-md bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-40"
        >
          スタート
        </button>
      </div>
    </div>
  )
}

import { Link, useNavigate } from 'react-router'
import { Chip, Radio, Section } from '../components/FormControls'
import { clozeTagLabel } from '../data/cloze'
import { filterCloze } from '../domain/cloze/quiz'
import { CLOZE_KIND_LABELS, CLOZE_KINDS } from '../domain/cloze/types'
import { LEVELS } from '../domain/cloze/validate'
import {
  allClozeItems,
  startClozeQuiz,
  useClozeStore,
  type ClozeSetup as Setup,
} from '../store/clozeStore'
import { toggle } from '../utils/list'

const COUNTS = [10, 20, 30]

export function ClozeSetup() {
  const setup = useClozeStore((s) => s.setup)
  const customItems = useClozeStore((s) => s.customItems)
  const updateSetup = useClozeStore((s) => s.updateSetup)
  const navigate = useNavigate()

  const items = allClozeItems(customItems)
  const poolSize = filterCloze(items, setup).length
  // 選んだ種類の問題にあるタグだけを表示する
  const availableTags = [
    ...new Set(items.filter((i) => setup.kinds.includes(i.kind)).flatMap((i) => i.tags)),
  ]

  const begin = async () => {
    await startClozeQuiz(setup)
    navigate('/cloze/quiz')
  }

  return (
    <div className="grid gap-6">
      <div className="flex items-baseline justify-between">
        <h2 className="text-xl font-bold">例文穴埋めの設定</h2>
        <Link to="/cloze/manage" className="text-sm text-link underline">
          自作問題の管理（{customItems.length}問）
        </Link>
      </div>

      <Section title="種類">
        <div className="flex flex-wrap gap-2">
          {CLOZE_KINDS.map((kind) => (
            <Chip
              key={kind}
              checked={setup.kinds.includes(kind)}
              onChange={() => updateSetup({ kinds: toggle(setup.kinds, kind), tags: [] })}
              label={CLOZE_KIND_LABELS[kind]}
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

      <Section title="タグ（時制・カテゴリ）">
        <div className="flex flex-wrap gap-2">
          <Chip
            checked={setup.tags.length === 0}
            onChange={() => updateSetup({ tags: [] })}
            label="すべて"
          />
          {availableTags.map((tag) => (
            <Chip
              key={tag}
              checked={setup.tags.includes(tag)}
              onChange={() => updateSetup({ tags: toggle(setup.tags, tag) })}
              label={clozeTagLabel(tag)}
            />
          ))}
        </div>
      </Section>

      <Section title="出題する問題">
        <Radio<boolean>
          value={setup.customOnly}
          onChange={(customOnly) => updateSetup({ customOnly })}
          options={[
            { value: false, label: '組み込み＋自作' },
            { value: true, label: '自作問題のみ' },
          ]}
        />
      </Section>

      <Section title="出題形式">
        <Radio<Setup['format']>
          value={setup.format}
          onChange={(format) => updateSetup({ format })}
          options={[
            { value: 'input', label: '入力' },
            { value: 'choice', label: '4択' },
          ]}
        />
      </Section>

      {setup.format === 'input' && (
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

      <Section title="出題の優先">
        <Chip
          checked={setup.prioritizeReview}
          onChange={() => updateSetup({ prioritizeReview: !setup.prioritizeReview })}
          label="復習時期の問題・未出題の問題を優先する"
        />
      </Section>

      <Section title="問題数">
        <Radio<number>
          value={setup.count}
          onChange={(count) => updateSetup({ count })}
          options={COUNTS.map((c) => ({ value: c, label: `${c}問` }))}
        />
      </Section>

      <div className="grid gap-2">
        {poolSize === 0 ? (
          <p className="text-sm text-danger">条件に合う問題がありません。</p>
        ) : (
          poolSize < setup.count && (
            <p className="text-sm text-ink-muted">
              条件に合う問題が {poolSize} 問なので、全て出題します。
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

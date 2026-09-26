import { useMemo } from 'react'
import { useNavigate } from 'react-router'
import { Chip, Radio, Section } from '../components/FormControls'
import { VERBS } from '../data/verbs'
import { VOCAB, VOCAB_CATEGORIES } from '../data/vocab'
import { TENSES, type Tense } from '../domain/conjugation/types'
import {
  ALL_TENSES,
  SECTION_LABELS,
  TEST_SECTIONS,
  allocate,
  buildTestPools,
  type TestRange,
} from '../domain/test/compose'
import type { Level } from '../domain/vocab/types'
import { allClozeItems, useClozeStore } from '../store/clozeStore'
import { rangeOf, startTest, useTestStore, type TestSetup as Setup } from '../store/testStore'
import { toggle } from '../utils/list'

const LEVELS: Level[] = ['A1', 'A2', 'B1']
const COUNTS = [10, 20, 30, 50]
const TIME_LIMITS: (number | null)[] = [null, 5, 10, 20, 30]

export function TestSetup() {
  const setup = useTestStore((s) => s.setup)
  const updateSetup = useTestStore((s) => s.updateSetup)
  const customItems = useClozeStore((s) => s.customItems)
  const navigate = useNavigate()

  // 候補の数え直しは範囲か自作問題が変わったときだけ行う（活用の候補は数万になるため）
  const rangeKey = JSON.stringify(rangeOf(setup))
  const data = useMemo(
    () => ({ verbs: VERBS, vocab: VOCAB, cloze: allClozeItems(customItems) }),
    [customItems],
  )
  const sizes = useMemo(() => {
    const pools = buildTestPools(JSON.parse(rangeKey) as TestRange, data)
    return { conj: pools.conj.length, vocab: pools.vocab.length, cloze: pools.cloze.length }
  }, [rangeKey, data])
  const counts = allocate(setup.count, setup.sections, sizes)
  const total = counts.conj + counts.vocab + counts.cloze

  const allTenses = setup.tenses.length === ALL_TENSES.length
  const allCategories = setup.categories.length === VOCAB_CATEGORIES.length

  const begin = () => {
    startTest(setup)
    navigate('/test/run')
  }

  return (
    <div className="grid gap-6">
      <h2 className="text-xl font-bold">総合テストの設定</h2>
      <p className="text-sm text-gray-600">
        活用・語彙・例文穴埋めを混ぜて出題します。途中では正誤を表示せず、最後にまとめて採点します。
      </p>

      <Section title="分野">
        <div className="flex flex-wrap gap-2">
          {TEST_SECTIONS.map((s) => (
            <Chip
              key={s}
              checked={setup.sections.includes(s)}
              onChange={() => updateSetup({ sections: toggle(setup.sections, s) })}
              label={SECTION_LABELS[s]}
            />
          ))}
        </div>
      </Section>

      <Section title="時制（活用・活用の穴埋め）">
        <div className="flex flex-wrap gap-2">
          <Chip
            checked={allTenses}
            onChange={() => updateSetup({ tenses: allTenses ? [] : ALL_TENSES })}
            label="すべて"
          />
          {ALL_TENSES.map((t: Tense) => (
            <Chip
              key={t}
              checked={setup.tenses.includes(t)}
              onChange={() => updateSetup({ tenses: toggle(setup.tenses, t) })}
              label={TENSES[t].label_ja}
            />
          ))}
        </div>
        <Chip
          checked={setup.includeVosotros}
          onChange={() => updateSetup({ includeVosotros: !setup.includeVosotros })}
          label="vosotros を含める"
        />
      </Section>

      <Section title="レベル（語彙・穴埋め）">
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

      <Section title="カテゴリ（語彙・語彙の穴埋め）">
        <div className="flex flex-wrap gap-2">
          <Chip
            checked={allCategories}
            onChange={() =>
              updateSetup({ categories: allCategories ? [] : VOCAB_CATEGORIES.map((c) => c.id) })
            }
            label="すべて"
          />
          {VOCAB_CATEGORIES.map((c) => (
            <Chip
              key={c.id}
              checked={setup.categories.includes(c.id)}
              onChange={() => updateSetup({ categories: toggle(setup.categories, c.id) })}
              label={c.label_ja}
            />
          ))}
        </div>
      </Section>

      <Section title="自作問題">
        <Chip
          checked={setup.includeCustom}
          onChange={() => updateSetup({ includeCustom: !setup.includeCustom })}
          label={`自作の穴埋め問題を含める（${customItems.length}問）`}
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
              { value: 'lenient', label: 'ゆるめ（違いは正解）' },
              { value: 'strict', label: '厳密' },
            ]}
          />
        </Section>
      )}

      <Section title="問題数">
        <Radio<number>
          value={setup.count}
          onChange={(count) => updateSetup({ count })}
          options={COUNTS.map((c) => ({ value: c, label: `${c}問` }))}
        />
      </Section>

      <Section title="制限時間">
        <Radio<string>
          value={String(setup.timeLimitMin)}
          onChange={(v) => updateSetup({ timeLimitMin: v === 'null' ? null : Number(v) })}
          options={TIME_LIMITS.map((m) => ({
            value: String(m),
            label: m === null ? 'なし' : `${m}分`,
          }))}
        />
      </Section>

      <div className="grid gap-2">
        {total === 0 ? (
          <p className="text-sm text-red-600">
            分野と範囲を選んでください。条件に合う問題がありません。
          </p>
        ) : (
          <p className="text-sm text-gray-600">
            {TEST_SECTIONS.filter((s) => counts[s] > 0)
              .map((s) => `${SECTION_LABELS[s]} ${counts[s]}問`)
              .join('・')}
            （計 {total} 問）
          </p>
        )}
        <button
          type="button"
          onClick={begin}
          disabled={total === 0}
          className="rounded-md bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-40"
        >
          テストを始める
        </button>
      </div>
    </div>
  )
}

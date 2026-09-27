import { useMemo } from 'react'
import { useNavigate } from 'react-router'
import { Chip, Radio, Section } from '../components/FormControls'
import { VERBS } from '../data/verbs'
import { TENSES, type Mood, type Tense, type VerbEntry } from '../domain/conjugation/types'
import { buildConjugationPool } from '../domain/quiz/generator'
import {
  startConjugationQuiz,
  useConjugationStore,
  type ConjugationSetup as Setup,
} from '../store/conjugationStore'
import { toggle } from '../utils/list'

const MOODS: { mood: Mood; label: string }[] = [
  { mood: 'indicative', label: '直説法' },
  { mood: 'subjunctive', label: '接続法' },
  { mood: 'imperative', label: '命令法' },
]

const GROUPS: { group: VerbEntry['group']; label: string }[] = [
  { group: 'regular', label: '規則' },
  { group: 'stem', label: '語幹変化' },
  { group: 'irregular', label: '不規則' },
]

const COUNTS = [10, 20, 30]

export function ConjugationSetup() {
  const setup = useConjugationStore((s) => s.setup)
  const updateSetup = useConjugationStore((s) => s.updateSetup)
  const navigate = useNavigate()

  const poolSize = useMemo(() => buildConjugationPool(VERBS, setup).length, [setup])

  const begin = async () => {
    await startConjugationQuiz(setup)
    navigate('/conjugation/quiz')
  }

  return (
    <div className="grid gap-6">
      <h2 className="text-xl font-bold">活用クイズの設定</h2>

      <Section title="時制">
        {MOODS.map(({ mood, label }) => {
          const tenses = (Object.keys(TENSES) as Tense[]).filter((t) => TENSES[t].mood === mood)
          return (
            <fieldset key={mood} className="grid gap-1">
              <legend className="mb-1 text-sm font-semibold text-ink-muted">{label}</legend>
              <div className="flex flex-wrap gap-2">
                {tenses.map((t) => (
                  <Chip
                    key={t}
                    checked={setup.tenses.includes(t)}
                    onChange={() => updateSetup({ tenses: toggle(setup.tenses, t) })}
                    label={TENSES[t].label_ja
                      .replace(/^(直説法|接続法|命令法)/, '')
                      .replace(/^（(.+)）$/, '$1')}
                  />
                ))}
              </div>
            </fieldset>
          )
        })}
      </Section>

      <Section title="動詞の種類">
        <div className="flex flex-wrap gap-2">
          {GROUPS.map(({ group, label }) => (
            <Chip
              key={group}
              checked={setup.groups.includes(group)}
              onChange={() => updateSetup({ groups: toggle(setup.groups, group) })}
              label={label}
            />
          ))}
        </div>
      </Section>

      <Section title="人称">
        <Chip
          checked={setup.includeVosotros}
          onChange={() => updateSetup({ includeVosotros: !setup.includeVosotros })}
          label="vosotros を含める"
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
          <p className="text-sm text-danger">時制と動詞の種類を1つ以上選んでください。</p>
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

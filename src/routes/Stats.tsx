import { useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { BarList, StatTile, TableView } from '../components/charts/ChartParts'
import { ColumnChart } from '../components/charts/ColumnChart'
import { LineChart } from '../components/charts/LineChart'
import { VOCAB } from '../data/vocab'
import type { AttemptRow, TestResultRow } from '../db/db'
import { getDueItems, listAttempts } from '../db/progress'
import { listTestResults } from '../db/testResults'
import { TENSES } from '../domain/conjugation/types'
import {
  accuracy,
  accuracyByType,
  dailyActivity,
  studyStreak,
  tally,
  tenseAccuracy,
  testTrend,
  weakItems,
} from '../domain/stats/stats'
import { parseVocabItemId } from '../domain/srs/items'
import { displayEs } from '../domain/vocab/quiz'

const DAYS = 14
/** 苦手な時制の一覧に出す最低の回答数（少なすぎると正答率がぶれるため） */
const MIN_TENSE_ANSWERS = 3

/** now は読み込んだ時刻。日別の集計や連続日数の基準にする */
type Data = { attempts: AttemptRow[]; tests: TestResultRow[]; due: number; now: number }

const percentText = (p: number | null) => (p === null ? '—' : `${p}%`)
const formatDateTime = (ts: number) => {
  const d = new Date(ts)
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
}

export function Stats() {
  const [data, setData] = useState<Data | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    Promise.all([
      listAttempts(),
      listTestResults(),
      Promise.all([getDueItems('conj'), getDueItems('vocab'), getDueItems('cloze')]),
    ])
      .then(([attempts, tests, due]) =>
        setData({
          attempts,
          tests,
          due: due.reduce((n, rows) => n + rows.length, 0),
          now: Date.now(),
        }),
      )
      .catch((e) => {
        console.error(e)
        setError(true)
      })
  }, [])

  if (error) return <p className="text-danger">学習記録を読み込めませんでした。</p>
  if (!data) return <p className="text-ink-muted">読み込み中…</p>

  const { attempts, tests, now } = data
  if (attempts.length === 0 && tests.length === 0) {
    return (
      <div className="grid gap-4">
        <h2 className="text-xl font-bold">統計</h2>
        <p className="rounded-lg bg-surface-muted p-4 text-sm">
          まだ学習記録がありません。クイズに答えると、ここに正答率や学習の記録が表示されます。
        </p>
        <Link to="/" className="text-sm text-link underline">
          ホームへ
        </Link>
      </div>
    )
  }

  const all = tally(attempts)
  const byType = accuracyByType(attempts)
  const days = dailyActivity(attempts, DAYS, now)
  const tenses = tenseAccuracy(attempts).filter((t) => t.total >= MIN_TENSE_ANSWERS)
  const weakWords = weakItems(attempts, 'vocab').flatMap((w) => {
    const word = VOCAB.find((v) => v.id === parseVocabItemId(w.itemId))
    return word ? [{ ...w, word }] : []
  })
  const trend = testTrend(tests)

  return (
    <div className="grid gap-8">
      <h2 className="text-xl font-bold">統計</h2>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatTile label="連続学習日数" value={`${studyStreak(attempts, now)}日`} />
        <StatTile label="回答数" value={all.total.toLocaleString()} note="これまでの合計" />
        <StatTile label="正答率" value={percentText(accuracy(all))} note="これまでの合計" />
        <StatTile
          label="復習待ち"
          value={<Link to="/review" className="underline">{`${data.due}問`}</Link>}
        />
      </div>

      <Section title="分野別の正答率">
        <BarList
          ariaLabel="分野別の正答率"
          items={(
            [
              ['conj', '活用'],
              ['vocab', '語彙'],
              ['cloze', '例文穴埋め'],
            ] as const
          ).map(([type, label]) => ({
            key: type,
            label,
            percent: accuracy(byType[type]) ?? 0,
            valueLabel:
              byType[type].total === 0
                ? '未回答'
                : `${accuracy(byType[type])}%（${byType[type].total}問）`,
          }))}
        />
      </Section>

      <Section title={`直近${DAYS}日の学習`}>
        <p className="text-sm text-ink-muted">回答数</p>
        <ColumnChart
          ariaLabel={`直近${DAYS}日の日別の回答数`}
          formatValue={(v) => `${Math.round(v)}`}
          data={days.map((d) => ({
            key: d.date,
            label: d.label,
            value: d.total,
            detail: d.total ? `正解 ${d.correct}問` : undefined,
          }))}
        />
        <p className="text-sm text-ink-muted">正答率</p>
        <LineChart
          ariaLabel={`直近${DAYS}日の日別の正答率`}
          data={days.map((d) => ({
            key: d.date,
            label: d.label,
            value: accuracy(d),
            detail: d.total ? `${d.correct} / ${d.total}問` : undefined,
          }))}
        />
        <TableView
          caption={`直近${DAYS}日の学習`}
          headers={['日付', '回答数', '正解数', '正答率']}
          rows={days.map((d) => [d.label, d.total, d.correct, percentText(accuracy(d))])}
        />
      </Section>

      <Section title="苦手な時制">
        {tenses.length === 0 ? (
          <Empty>活用の回答が{MIN_TENSE_ANSWERS}問以上ある時制がまだありません。</Empty>
        ) : (
          <>
            <p className="text-xs text-ink-subtle">
              正答率の低い順（回答が{MIN_TENSE_ANSWERS}問以上の時制）
            </p>
            <BarList
              ariaLabel="時制別の正答率"
              items={tenses.map((t) => ({
                key: t.tense,
                label: TENSES[t.tense].label_ja,
                percent: accuracy(t) ?? 0,
                valueLabel: `${accuracy(t)}%（${t.total}問）`,
              }))}
            />
          </>
        )}
      </Section>

      <Section title="苦手な単語">
        {weakWords.length === 0 ? (
          <Empty>間違えた単語はまだありません。</Empty>
        ) : (
          <table className="w-full border-collapse text-sm">
            <caption className="sr-only">間違えた回数の多い単語</caption>
            <thead>
              <tr className="text-left">
                <th scope="col" className="border-b border-line px-2 py-1">
                  単語
                </th>
                <th scope="col" className="border-b border-line px-2 py-1">
                  意味
                </th>
                <th scope="col" className="border-b border-line px-2 py-1 text-right">
                  間違い
                </th>
                <th scope="col" className="border-b border-line px-2 py-1 text-right">
                  正答率
                </th>
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {weakWords.map((w) => (
                <tr key={w.itemId}>
                  <td className="border-b border-line-soft px-2 py-1 font-semibold" lang="es">
                    {displayEs(w.word)}
                  </td>
                  <td className="border-b border-line-soft px-2 py-1">{w.word.ja}</td>
                  <td className="border-b border-line-soft px-2 py-1 text-right">{w.wrong}回</td>
                  <td className="border-b border-line-soft px-2 py-1 text-right">
                    {percentText(accuracy({ total: w.total, correct: w.total - w.wrong }))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>

      <Section title="総合テストのスコア推移">
        {trend.length === 0 ? (
          <Empty>
            まだ総合テストを受けていません。
            <Link to="/test" className="ml-1 text-link underline">
              総合テストへ
            </Link>
          </Empty>
        ) : (
          <>
            <LineChart
              ariaLabel="総合テストの正答率の推移"
              data={trend.map((p, i) => ({
                key: `${p.at}-${i}`,
                label: p.label,
                value: p.percent,
                detail: `${p.correct} / ${p.total}問`,
              }))}
            />
            <TableView
              caption="総合テストの結果"
              headers={['日時', '点数', '正答率', '時間切れ']}
              rows={[...tests]
                .sort((a, b) => b.at - a.at)
                .map((t) => [
                  formatDateTime(t.at),
                  `${t.correct} / ${t.total}`,
                  percentText(accuracy(t)),
                  t.timedOut ? 'あり' : '',
                ])}
            />
          </>
        )}
      </Section>
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="grid gap-3">
      <h3 className="font-semibold">{title}</h3>
      {children}
    </section>
  )
}

function Empty({ children }: { children: ReactNode }) {
  return <p className="text-sm text-ink-muted">{children}</p>
}

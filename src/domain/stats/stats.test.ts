import { describe, expect, it } from 'vitest'
import {
  accuracy,
  accuracyByType,
  dailyActivity,
  localDayKey,
  studyStreak,
  tenseAccuracy,
  testTrend,
  weakItems,
  type AttemptLike,
} from './stats'

/** 端末のタイムゾーンで、2026年9月 day 日 hour 時 */
const at = (day: number, hour = 12) => new Date(2026, 8, day, hour).getTime()
const NOW = at(26, 15)

const conj = (tense: string, correct: boolean, day = 26): AttemptLike => ({
  itemId: `conj:hablar:${tense}:0`,
  type: 'conj',
  correct,
  at: at(day),
})
const vocab = (id: string, correct: boolean, day = 26): AttemptLike => ({
  itemId: `vocab:${id}`,
  type: 'vocab',
  correct,
  at: at(day),
})

describe('日付', () => {
  it('端末のタイムゾーンの日付で区切る', () => {
    expect(localDayKey(at(26, 0))).toBe('2026-09-26')
    expect(localDayKey(at(26, 23))).toBe('2026-09-26')
    expect(localDayKey(at(27, 0))).toBe('2026-09-27')
  })
})

describe('dailyActivity', () => {
  it('直近の日数分を古い順に並べ、回答のない日は 0', () => {
    const days = dailyActivity(
      [conj('present', true, 26), conj('present', false, 26), vocab('food:agua', true, 24)],
      3,
      NOW,
    )
    expect(days).toEqual([
      { date: '2026-09-24', label: '9/24', total: 1, correct: 1 },
      { date: '2026-09-25', label: '9/25', total: 0, correct: 0 },
      { date: '2026-09-26', label: '9/26', total: 2, correct: 1 },
    ])
  })

  it('月をまたいでも日付が続く', () => {
    const days = dailyActivity([], 3, new Date(2026, 9, 1, 9).getTime())
    expect(days.map((d) => d.label)).toEqual(['9/29', '9/30', '10/1'])
  })
})

describe('studyStreak', () => {
  it('今日まで続けて学習した日数を数える', () => {
    expect(
      studyStreak(
        [conj('present', true, 24), conj('present', true, 25), conj('present', false, 26)],
        NOW,
      ),
    ).toBe(3)
  })

  it('今日まだ学習していなければ昨日から数える', () => {
    expect(studyStreak([conj('present', true, 24), conj('present', true, 25)], NOW)).toBe(2)
  })

  it('途切れたら 0', () => {
    expect(studyStreak([conj('present', true, 23)], NOW)).toBe(0)
    expect(studyStreak([], NOW)).toBe(0)
  })
})

describe('集計', () => {
  const attempts = [
    conj('present', true),
    conj('present', true),
    conj('preterite', false),
    conj('preterite', true),
    conj('subjunctivePresent', false),
    vocab('food:agua', false),
    vocab('food:agua', false),
    vocab('food:agua', true),
    vocab('house:libro', false),
    vocab('house:mesa', true),
  ]

  it('分野ごとの正答率', () => {
    const byType = accuracyByType(attempts)
    expect(byType.conj).toEqual({ total: 5, correct: 3 })
    expect(byType.vocab).toEqual({ total: 5, correct: 2 })
    expect(accuracy(byType.cloze)).toBeNull()
    expect(accuracy(byType.conj)).toBe(60)
  })

  it('時制ごとの正答率を低い順に並べる', () => {
    expect(tenseAccuracy(attempts)).toEqual([
      { tense: 'subjunctivePresent', total: 1, correct: 0 },
      { tense: 'preterite', total: 2, correct: 1 },
      { tense: 'present', total: 2, correct: 2 },
    ])
  })

  it('間違えた回数の多い単語を並べ、間違えていない単語は含めない', () => {
    expect(weakItems(attempts, 'vocab')).toEqual([
      { itemId: 'vocab:food:agua', total: 3, wrong: 2 },
      { itemId: 'vocab:house:libro', total: 1, wrong: 1 },
    ])
    expect(weakItems(attempts, 'vocab', 1)).toHaveLength(1)
  })
})

describe('testTrend', () => {
  it('総合テストの結果を古い順の正答率にする', () => {
    expect(
      testTrend([
        { at: at(26), correct: 8, total: 10 },
        { at: at(20), correct: 1, total: 3 },
      ]).map((p) => [p.label, p.percent]),
    ).toEqual([
      ['9/20', 33],
      ['9/26', 80],
    ])
  })
})

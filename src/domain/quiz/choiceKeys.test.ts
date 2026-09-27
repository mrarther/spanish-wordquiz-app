import { describe, expect, it } from 'vitest'
import { choiceIndexFromKey } from './choiceKeys'

describe('choiceIndexFromKey', () => {
  it('1〜4 を 0〜3 の番号にする', () => {
    expect(['1', '2', '3', '4'].map((k) => choiceIndexFromKey(k, 4))).toEqual([0, 1, 2, 3])
  })

  it('選択肢の数を超える数字・0・数字以外は対象外', () => {
    expect(choiceIndexFromKey('5', 4)).toBeNull()
    expect(choiceIndexFromKey('3', 2)).toBeNull()
    expect(choiceIndexFromKey('0', 4)).toBeNull()
    expect(choiceIndexFromKey('a', 4)).toBeNull()
    expect(choiceIndexFromKey('Enter', 4)).toBeNull()
    expect(choiceIndexFromKey('10', 4)).toBeNull()
  })
})

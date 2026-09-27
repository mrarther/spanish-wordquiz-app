import { describe, expect, it } from 'vitest'
import { columnPath, labelStep, niceMax, yTicks } from './scale'

describe('グラフの目盛り', () => {
  it('上限をきりのよい値に切り上げる', () => {
    expect(niceMax(0)).toBe(1)
    expect(niceMax(3)).toBe(5)
    expect(niceMax(7)).toBe(10)
    expect(niceMax(12)).toBe(20)
    expect(niceMax(100)).toBe(100)
    expect(niceMax(101)).toBe(200)
  })

  it('幅が狭いときはラベルを間引く', () => {
    expect(labelStep(40)).toBe(1)
    expect(labelStep(20)).toBe(2)
    expect(labelStep(10)).toBe(4)
  })

  it('高さ 0 の棒は描かない。低い棒は角丸を高さに合わせる', () => {
    expect(columnPath(0, 10, 20, 0)).toBe('')
    expect(columnPath(0, 10, 20, 2)).toBe('M0,12V12Q0,10 2,10H18Q20,10 20,12V12Z')
  })

  it('中間の目盛りは整数のときだけ置く', () => {
    expect(yTicks(10)).toEqual([0, 5, 10])
    expect(yTicks(2)).toEqual([0, 1, 2])
    expect(yTicks(5)).toEqual([0, 5])
    expect(yTicks(1)).toEqual([0, 1])
  })
})

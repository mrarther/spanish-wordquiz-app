import { describe, expect, it } from 'vitest'
import { isSpeechSupported, pickVoice } from './speech'

const voices = [
  { name: 'Kyoko', lang: 'ja-JP' },
  { name: 'Paulina', lang: 'es-MX' },
  { name: 'Monica', lang: 'es-ES' },
  { name: 'Diego', lang: 'es_AR' },
]

describe('pickVoice', () => {
  it('地域まで一致する音声を選ぶ', () => {
    expect(pickVoice(voices, 'es-ES')?.name).toBe('Monica')
    expect(pickVoice(voices, 'es-MX')?.name).toBe('Paulina')
  })

  it('一致しなければ同じ言語の音声を選ぶ（es_AR のような書き方も扱う）', () => {
    expect(pickVoice(voices.slice(0, 2), 'es-ES')?.name).toBe('Paulina')
    expect(pickVoice([voices[0], voices[3]], 'es-MX')?.name).toBe('Diego')
    expect(pickVoice([{ name: 'X', lang: 'ES-es' }], 'es-ES')?.name).toBe('X')
  })

  it('スペイン語の音声がなければ undefined', () => {
    expect(pickVoice([voices[0]], 'es-ES')).toBeUndefined()
    expect(pickVoice([], 'es-ES')).toBeUndefined()
  })
})

describe('isSpeechSupported', () => {
  it('ブラウザ以外（テスト環境）では false', () => {
    expect(isSpeechSupported()).toBe(false)
  })
})

import { describe, expect, it } from 'vitest'

describe('test setup', () => {
  it('runs vitest', () => {
    expect('comí'.normalize('NFC')).toBe('comí')
  })
})

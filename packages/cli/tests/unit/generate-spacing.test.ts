import { describe, test, expect } from 'bun:test'

import { generateSpacing } from '../../src/commands/generate/spacing.ts'

describe('generateSpacing', () => {
  test('4pt system generates expected token count', () => {
    const scale = generateSpacing(4, '4pt')
    expect(scale.length).toBeGreaterThan(15)
  })

  test('8pt system generates expected token count', () => {
    const scale = generateSpacing(8, '8pt')
    expect(scale.length).toBeGreaterThan(10)
  })

  test('starts with 0', () => {
    const scale = generateSpacing(4, '4pt')
    expect(scale[0]!.value).toBe(0)
    expect(scale[0]!.name).toBe('0')
  })

  test('values increase monotonically', () => {
    const scale = generateSpacing(4, '4pt')
    for (let i = 1; i < scale.length; i++) {
      expect(scale[i]!.value).toBeGreaterThanOrEqual(scale[i - 1]!.value)
    }
  })

  test('4px base uses correct multiples', () => {
    const scale = generateSpacing(4, '4pt')
    // Check some known values: 4*1=4, 4*2=8, 4*4=16
    expect(scale.find((s) => s.name === '1')!.value).toBe(4)
    expect(scale.find((s) => s.name === '2')!.value).toBe(8)
    expect(scale.find((s) => s.name === '4')!.value).toBe(16)
  })

  test('8px base uses correct multiples', () => {
    const scale = generateSpacing(8, '8pt')
    expect(scale.find((s) => s.name === '1')!.value).toBe(8)
    expect(scale.find((s) => s.name === '2')!.value).toBe(16)
    expect(scale.find((s) => s.name === '4')!.value).toBe(32)
  })

  test('rem values are correctly computed from px', () => {
    const scale = generateSpacing(4, '4pt')
    const step4 = scale.find((s) => s.name === '4')!
    expect(step4.value).toBe(16)
    expect(step4.rem).toBe(1) // 16px / 16 = 1rem
  })

  test('custom base unit works', () => {
    const scale = generateSpacing(6, '4pt')
    expect(scale.find((s) => s.name === '1')!.value).toBe(6)
    expect(scale.find((s) => s.name === '2')!.value).toBe(12)
  })

  test('half steps are included', () => {
    const scale = generateSpacing(4, '4pt')
    const half = scale.find((s) => s.name === '0.5')
    expect(half).toBeDefined()
    expect(half!.value).toBe(2)
  })

  test('8pt system includes larger tokens', () => {
    const scale = generateSpacing(8, '8pt')
    const large = scale.find((s) => s.name === '24')
    expect(large).toBeDefined()
    expect(large!.value).toBe(192)
  })
})

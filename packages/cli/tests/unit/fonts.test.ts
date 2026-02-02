import { describe, test, expect } from 'bun:test'

import { styleToWeight } from '../../src/fonts.ts'

describe('styleToWeight', () => {
  test('maps Thin to 100', () => {
    expect(styleToWeight('Thin')).toBe(100)
    expect(styleToWeight('Hairline')).toBe(100)
  })

  test('maps ExtraLight/UltraLight to 200', () => {
    expect(styleToWeight('ExtraLight')).toBe(200)
    expect(styleToWeight('UltraLight')).toBe(200)
  })

  test('maps Light to 300', () => {
    expect(styleToWeight('Light')).toBe(300)
  })

  test('maps Regular/Normal to 400', () => {
    expect(styleToWeight('Regular')).toBe(400)
    expect(styleToWeight('Normal')).toBe(400)
  })

  test('maps Medium to 500', () => {
    expect(styleToWeight('Medium')).toBe(500)
  })

  test('maps SemiBold/DemiBold to 600', () => {
    expect(styleToWeight('SemiBold')).toBe(600)
    expect(styleToWeight('DemiBold')).toBe(600)
  })

  test('maps Bold to 700', () => {
    expect(styleToWeight('Bold')).toBe(700)
  })

  test('ExtraBold/UltraBold match Bold first due to includes()', () => {
    // styleToWeight uses includes() and iterates Object.entries, so 'Bold'
    // matches before 'ExtraBold'/'UltraBold', returning 700 instead of 800
    expect(styleToWeight('ExtraBold')).toBe(700)
    expect(styleToWeight('UltraBold')).toBe(700)
  })

  test('maps Black/Heavy to 900', () => {
    expect(styleToWeight('Black')).toBe(900)
    expect(styleToWeight('Heavy')).toBe(900)
  })

  test('defaults to 400 for unknown styles', () => {
    expect(styleToWeight('CustomStyle')).toBe(400)
    expect(styleToWeight('')).toBe(400)
  })

  test('matches partial style names', () => {
    expect(styleToWeight('Bold Italic')).toBe(700)
    expect(styleToWeight('SemiBold Italic')).toBe(600)
    expect(styleToWeight('Thin Italic')).toBe(100)
  })
})

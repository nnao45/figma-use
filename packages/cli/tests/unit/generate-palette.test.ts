import { describe, test, expect } from 'bun:test'

import {
  generatePalette,
  contrastRatio
} from '../../src/commands/generate/palette.ts'

describe('generatePalette', () => {
  test('generates 11 shades (50-950)', () => {
    const palette = generatePalette('#3B82F6')
    expect(palette).toHaveLength(11)
    expect(palette.map((s) => s.step)).toEqual([50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950])
  })

  test('all shades have valid hex colors', () => {
    const palette = generatePalette('#3B82F6')
    for (const shade of palette) {
      expect(shade.hex).toMatch(/^#[0-9A-F]{6}$/)
    }
  })

  test('50 is lightest and 950 is darkest', () => {
    const palette = generatePalette('#3B82F6')
    const first = palette[0]!
    const last = palette[palette.length - 1]!
    // Shade 50 should have higher lightness than shade 950
    expect(first.hsl.l).toBeGreaterThan(last.hsl.l)
  })

  test('lightness decreases monotonically', () => {
    const palette = generatePalette('#3B82F6')
    for (let i = 1; i < palette.length; i++) {
      expect(palette[i]!.hsl.l).toBeLessThanOrEqual(palette[i - 1]!.hsl.l)
    }
  })

  test('works with different base colors', () => {
    const red = generatePalette('#EF4444')
    const green = generatePalette('#22C55E')
    const gray = generatePalette('#6B7280')

    expect(red).toHaveLength(11)
    expect(green).toHaveLength(11)
    expect(gray).toHaveLength(11)

    // Each palette should have different hues
    expect(red[5]!.hsl.h).not.toBe(green[5]!.hsl.h)
    expect(red[5]!.hsl.h).not.toBe(gray[5]!.hsl.h)
  })

  test('shade 500 hue matches base color hue', () => {
    const palette = generatePalette('#3B82F6')
    const base500 = palette.find((s) => s.step === 500)!
    // HSL hue should be in the blue range (200-230)
    expect(base500.hsl.h).toBeGreaterThan(190)
    expect(base500.hsl.h).toBeLessThan(240)
  })

  test('pure white base generates light to dark scale', () => {
    const palette = generatePalette('#FFFFFF')
    expect(palette[0]!.hsl.l).toBeGreaterThan(90)
    expect(palette[palette.length - 1]!.hsl.l).toBeLessThan(20)
  })

  test('pure black base still generates varied scale', () => {
    const palette = generatePalette('#000000')
    expect(palette).toHaveLength(11)
    // 50 should still be light
    expect(palette[0]!.hsl.l).toBeGreaterThan(80)
  })
})

describe('contrastRatio', () => {
  test('black on white is ~21:1', () => {
    const ratio = contrastRatio('#FFFFFF', '#000000')
    expect(ratio).toBeCloseTo(21, 0)
  })

  test('white on white is 1:1', () => {
    const ratio = contrastRatio('#FFFFFF', '#FFFFFF')
    expect(ratio).toBeCloseTo(1, 1)
  })

  test('is symmetric', () => {
    const r1 = contrastRatio('#3B82F6', '#FFFFFF')
    const r2 = contrastRatio('#FFFFFF', '#3B82F6')
    expect(r1).toBeCloseTo(r2, 5)
  })

  test('blue on white gives expected ratio', () => {
    const ratio = contrastRatio('#3B82F6', '#FFFFFF')
    // Blue #3B82F6 has approximately 3.5-4:1 contrast with white
    expect(ratio).toBeGreaterThan(3)
    expect(ratio).toBeLessThan(5)
  })

  test('dark text on light background passes AA', () => {
    const ratio = contrastRatio('#1E293B', '#F8FAFC')
    expect(ratio).toBeGreaterThanOrEqual(4.5)
  })
})

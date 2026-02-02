import { describe, test, expect } from 'bun:test'

import {
  generateTypescale,
  SCALE_RATIOS,
  SCALE_NAMES
} from '../../src/commands/generate/typescale.ts'

describe('generateTypescale', () => {
  test('generates 10 steps by default', () => {
    const scale = generateTypescale()
    expect(scale).toHaveLength(10)
  })

  test('uses correct step names', () => {
    const scale = generateTypescale()
    expect(scale.map((s) => s.name)).toEqual(SCALE_NAMES)
  })

  test('base step is 16px by default', () => {
    const scale = generateTypescale()
    const base = scale.find((s) => s.name === 'base')!
    expect(base.fontSize).toBe(16)
  })

  test('font sizes increase monotonically', () => {
    const scale = generateTypescale()
    for (let i = 1; i < scale.length; i++) {
      expect(scale[i]!.fontSize).toBeGreaterThanOrEqual(scale[i - 1]!.fontSize)
    }
  })

  test('custom base size works', () => {
    const scale = generateTypescale(20)
    const base = scale.find((s) => s.name === 'base')!
    expect(base.fontSize).toBe(20)
  })

  test('custom ratio changes scale spread', () => {
    const tight = generateTypescale(16, 1.125) // minor-second
    const wide = generateTypescale(16, 1.5) // perfect-fifth

    const tight6xl = tight.find((s) => s.name === '6xl')!
    const wide6xl = wide.find((s) => s.name === '6xl')!

    // Wider ratio should produce larger sizes at the top
    expect(wide6xl.fontSize).toBeGreaterThan(tight6xl.fontSize)
  })

  test('limits to requested number of steps', () => {
    const scale = generateTypescale(16, 1.25, 5)
    expect(scale).toHaveLength(5)
    expect(scale[0]!.name).toBe('xs')
  })

  test('line heights are reasonable', () => {
    const scale = generateTypescale()
    for (const step of scale) {
      // Line height should be greater than font size
      expect(step.lineHeight).toBeGreaterThan(step.fontSize)
      // But not more than 2x
      expect(step.lineHeight).toBeLessThan(step.fontSize * 2)
    }
  })

  test('letter spacing tightens for large sizes', () => {
    const scale = generateTypescale()
    const xs = scale.find((s) => s.name === 'xs')!
    const sixXl = scale.find((s) => s.name === '6xl')!
    // Small text should have wider (more positive) tracking than large text
    expect(xs.letterSpacing).toBeGreaterThan(sixXl.letterSpacing)
  })

  test('weights increase for larger steps', () => {
    const scale = generateTypescale()
    const base = scale.find((s) => s.name === 'base')!
    const fourXl = scale.find((s) => s.name === '4xl')!
    expect(fourXl.weight).toBeGreaterThanOrEqual(base.weight)
  })
})

describe('SCALE_RATIOS', () => {
  test('contains expected presets', () => {
    expect(SCALE_RATIOS['minor-second']).toBe(1.067)
    expect(SCALE_RATIOS['major-third']).toBe(1.25)
    expect(SCALE_RATIOS['perfect-fourth']).toBe(1.333)
    expect(SCALE_RATIOS['golden-ratio']).toBe(1.618)
  })

  test('all ratios are greater than 1', () => {
    for (const [, ratio] of Object.entries(SCALE_RATIOS)) {
      expect(ratio).toBeGreaterThan(1)
    }
  })
})

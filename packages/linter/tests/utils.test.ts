import { describe, test, expect } from 'bun:test'

import {
  rgbToHex,
  hexToRgb,
  colorDistance,
  relativeLuminance,
  contrastRatio,
  isMultipleOf,
  getNodePath,
  isDefaultName,
  SPACING_SCALE,
  FONT_SIZE_SCALE
} from '../src/core/utils.ts'

describe('rgbToHex', () => {
  test('converts black', () => {
    expect(rgbToHex({ r: 0, g: 0, b: 0 })).toBe('#000000')
  })

  test('converts white', () => {
    expect(rgbToHex({ r: 1, g: 1, b: 1 })).toBe('#FFFFFF')
  })

  test('converts red', () => {
    expect(rgbToHex({ r: 1, g: 0, b: 0 })).toBe('#FF0000')
  })

  test('converts arbitrary color', () => {
    expect(rgbToHex({ r: 0.2, g: 0.4, b: 0.6 })).toBe('#336699')
  })
})

describe('hexToRgb', () => {
  test('parses black', () => {
    const rgb = hexToRgb('#000000')
    expect(rgb.r).toBeCloseTo(0)
    expect(rgb.g).toBeCloseTo(0)
    expect(rgb.b).toBeCloseTo(0)
  })

  test('parses white', () => {
    const rgb = hexToRgb('#FFFFFF')
    expect(rgb.r).toBeCloseTo(1)
    expect(rgb.g).toBeCloseTo(1)
    expect(rgb.b).toBeCloseTo(1)
  })

  test('parses without hash', () => {
    const rgb = hexToRgb('FF0000')
    expect(rgb.r).toBeCloseTo(1)
    expect(rgb.g).toBeCloseTo(0)
    expect(rgb.b).toBeCloseTo(0)
  })

  test('throws for invalid hex', () => {
    expect(() => hexToRgb('invalid')).toThrow('Invalid hex color')
    expect(() => hexToRgb('#GGG')).toThrow('Invalid hex color')
  })

  test('round-trips with rgbToHex', () => {
    const original = { r: 0.5, g: 0.25, b: 0.75 }
    const hex = rgbToHex(original)
    const back = hexToRgb(hex)
    expect(back.r).toBeCloseTo(original.r, 1)
    expect(back.g).toBeCloseTo(original.g, 1)
    expect(back.b).toBeCloseTo(original.b, 1)
  })
})

describe('colorDistance', () => {
  test('returns 0 for same colors', () => {
    const c = { r: 0.5, g: 0.5, b: 0.5 }
    expect(colorDistance(c, c)).toBe(0)
  })

  test('returns max for black vs white', () => {
    const black = { r: 0, g: 0, b: 0 }
    const white = { r: 1, g: 1, b: 1 }
    expect(colorDistance(black, white)).toBeCloseTo(Math.sqrt(3), 5)
  })

  test('calculates intermediate distance', () => {
    const a = { r: 1, g: 0, b: 0 }
    const b = { r: 0, g: 1, b: 0 }
    expect(colorDistance(a, b)).toBeCloseTo(Math.sqrt(2), 5)
  })
})

describe('relativeLuminance', () => {
  test('black has 0 luminance', () => {
    expect(relativeLuminance({ r: 0, g: 0, b: 0 })).toBeCloseTo(0, 5)
  })

  test('white has 1 luminance', () => {
    expect(relativeLuminance({ r: 1, g: 1, b: 1 })).toBeCloseTo(1, 2)
  })

  test('green contributes most', () => {
    const rOnly = relativeLuminance({ r: 1, g: 0, b: 0 })
    const gOnly = relativeLuminance({ r: 0, g: 1, b: 0 })
    const bOnly = relativeLuminance({ r: 0, g: 0, b: 1 })
    expect(gOnly).toBeGreaterThan(rOnly)
    expect(gOnly).toBeGreaterThan(bOnly)
  })
})

describe('contrastRatio', () => {
  test('black vs white is 21:1', () => {
    const black = { r: 0, g: 0, b: 0 }
    const white = { r: 1, g: 1, b: 1 }
    expect(contrastRatio(black, white)).toBeCloseTo(21, 0)
  })

  test('same color has 1:1', () => {
    const c = { r: 0.5, g: 0.5, b: 0.5 }
    expect(contrastRatio(c, c)).toBeCloseTo(1, 1)
  })

  test('order does not matter', () => {
    const a = { r: 0.2, g: 0.2, b: 0.2 }
    const b = { r: 0.8, g: 0.8, b: 0.8 }
    expect(contrastRatio(a, b)).toBeCloseTo(contrastRatio(b, a), 5)
  })
})

describe('isMultipleOf', () => {
  test('exact multiples', () => {
    expect(isMultipleOf(16, 8)).toBe(true)
    expect(isMultipleOf(24, 8)).toBe(true)
    expect(isMultipleOf(0, 8)).toBe(true)
  })

  test('non-multiples', () => {
    expect(isMultipleOf(15, 8)).toBe(false)
    expect(isMultipleOf(7, 8)).toBe(false)
  })

  test('handles floating point with tolerance', () => {
    expect(isMultipleOf(16.005, 8, 0.01)).toBe(true)
    expect(isMultipleOf(15.99, 8, 0.02)).toBe(true)
  })

  test('returns false for base 0', () => {
    expect(isMultipleOf(10, 0)).toBe(false)
  })
})

describe('getNodePath', () => {
  test('returns path for single node', () => {
    expect(getNodePath({ name: 'Button' })).toEqual(['Button'])
  })

  test('returns path for nested nodes', () => {
    const node = {
      name: 'Icon',
      parent: {
        name: 'Button',
        parent: {
          name: 'Card'
        }
      }
    }
    expect(getNodePath(node)).toEqual(['Card', 'Button', 'Icon'])
  })
})

describe('isDefaultName', () => {
  test('detects default names', () => {
    expect(isDefaultName('Frame')).toBe(true)
    expect(isDefaultName('Frame 1')).toBe(true)
    expect(isDefaultName('Rectangle 42')).toBe(true)
    expect(isDefaultName('Ellipse')).toBe(true)
    expect(isDefaultName('Text 3')).toBe(true)
    expect(isDefaultName('Group 7')).toBe(true)
    expect(isDefaultName('Vector')).toBe(true)
    expect(isDefaultName('Component 1')).toBe(true)
    expect(isDefaultName('Instance 2')).toBe(true)
    expect(isDefaultName('Slice')).toBe(true)
    expect(isDefaultName('Section 1')).toBe(true)
  })

  test('rejects custom names', () => {
    expect(isDefaultName('Header')).toBe(false)
    expect(isDefaultName('My Button')).toBe(false)
    expect(isDefaultName('icon-check')).toBe(false)
    expect(isDefaultName('Card / Title')).toBe(false)
  })
})

describe('SPACING_SCALE', () => {
  test('starts at 0', () => {
    expect(SPACING_SCALE[0]).toBe(0)
  })

  test('includes 8pt grid values', () => {
    expect(SPACING_SCALE).toContain(8)
    expect(SPACING_SCALE).toContain(16)
    expect(SPACING_SCALE).toContain(24)
    expect(SPACING_SCALE).toContain(32)
  })

  test('is sorted ascending', () => {
    for (let i = 1; i < SPACING_SCALE.length; i++) {
      expect(SPACING_SCALE[i]).toBeGreaterThan(SPACING_SCALE[i - 1])
    }
  })
})

describe('FONT_SIZE_SCALE', () => {
  test('includes common sizes', () => {
    expect(FONT_SIZE_SCALE).toContain(12)
    expect(FONT_SIZE_SCALE).toContain(14)
    expect(FONT_SIZE_SCALE).toContain(16)
    expect(FONT_SIZE_SCALE).toContain(24)
    expect(FONT_SIZE_SCALE).toContain(48)
  })

  test('is sorted ascending', () => {
    for (let i = 1; i < FONT_SIZE_SCALE.length; i++) {
      expect(FONT_SIZE_SCALE[i]).toBeGreaterThan(FONT_SIZE_SCALE[i - 1])
    }
  })
})

import { describe, test, expect } from 'bun:test'

import {
  formatType,
  formatColor,
  formatFill,
  formatStroke,
  formatText,
  formatFont,
  formatLayout,
  installHint
} from '../../src/format.ts'

describe('formatType', () => {
  test('maps known Figma types', () => {
    expect(formatType('FRAME')).toBe('frame')
    expect(formatType('RECTANGLE')).toBe('rect')
    expect(formatType('ELLIPSE')).toBe('ellipse')
    expect(formatType('TEXT')).toBe('text')
    expect(formatType('COMPONENT')).toBe('component')
    expect(formatType('INSTANCE')).toBe('instance')
    expect(formatType('GROUP')).toBe('group')
    expect(formatType('VECTOR')).toBe('vector')
    expect(formatType('LINE')).toBe('line')
    expect(formatType('BOOLEAN_OPERATION')).toBe('boolean')
    expect(formatType('SECTION')).toBe('section')
    expect(formatType('PAGE')).toBe('page')
  })

  test('lowercases unknown types', () => {
    expect(formatType('CUSTOM_TYPE')).toBe('custom_type')
    expect(formatType('SOMETHING')).toBe('something')
  })
})

describe('formatColor', () => {
  test('formats solid color', () => {
    expect(formatColor({ type: 'SOLID', color: '#FF0000' })).toBe('#FF0000')
  })

  test('formats solid color with opacity', () => {
    expect(formatColor({ type: 'SOLID', color: '#FF0000', opacity: 0.5 })).toBe('#FF000080')
  })

  test('omits alpha when opacity is 1', () => {
    expect(formatColor({ type: 'SOLID', color: '#FF0000', opacity: 1 })).toBe('#FF0000')
  })

  test('formats non-solid types', () => {
    expect(formatColor({ type: 'LINEAR_GRADIENT' })).toBe('linear_gradient')
    expect(formatColor({ type: 'RADIAL_GRADIENT' })).toBe('radial_gradient')
  })
})

describe('formatFill', () => {
  test('returns null for empty fills', () => {
    expect(formatFill([])).toBeNull()
    expect(formatFill(undefined)).toBeNull()
  })

  test('returns first solid fill', () => {
    expect(
      formatFill([
        { type: 'LINEAR_GRADIENT' },
        { type: 'SOLID', color: '#00FF00' }
      ])
    ).toBe('#00FF00')
  })

  test('returns null when no solid fill', () => {
    expect(formatFill([{ type: 'LINEAR_GRADIENT' }])).toBeNull()
  })
})

describe('formatStroke', () => {
  test('returns null for empty strokes', () => {
    expect(formatStroke([])).toBeNull()
    expect(formatStroke(undefined)).toBeNull()
  })

  test('formats stroke with weight', () => {
    expect(formatStroke([{ type: 'SOLID', color: '#000000' }], 2)).toBe('#000000 2px')
  })

  test('formats stroke without weight', () => {
    expect(formatStroke([{ type: 'SOLID', color: '#000000' }])).toBe('#000000')
  })

  test('returns null when no solid stroke', () => {
    expect(formatStroke([{ type: 'LINEAR_GRADIENT' }])).toBeNull()
  })
})

describe('formatText', () => {
  test('returns null for empty text', () => {
    expect(formatText(undefined)).toBeNull()
    expect(formatText('')).toBeNull()
  })

  test('wraps in quotes', () => {
    expect(formatText('Hello')).toBe('"Hello"')
  })

  test('truncates long text', () => {
    const long = 'a'.repeat(50)
    expect(formatText(long, 40)).toBe(`"${'a'.repeat(40)}…"`)
  })

  test('replaces newlines', () => {
    expect(formatText('line1\nline2')).toBe('"line1↵line2"')
  })
})

describe('formatFont', () => {
  test('returns null without fontSize', () => {
    expect(formatFont({} as any)).toBeNull()
  })

  test('formats font with size only', () => {
    expect(formatFont({ fontSize: 16 } as any)).toBe('font: 16px')
  })

  test('formats font with family', () => {
    expect(formatFont({ fontSize: 16, fontFamily: 'Inter' } as any)).toBe('font: 16px Inter')
  })

  test('formats font with family and style', () => {
    expect(formatFont({ fontSize: 16, fontFamily: 'Inter', fontStyle: 'Bold' } as any)).toBe(
      'font: 16px Inter Bold'
    )
  })

  test('omits Regular style', () => {
    expect(formatFont({ fontSize: 16, fontFamily: 'Inter', fontStyle: 'Regular' } as any)).toBe(
      'font: 16px Inter'
    )
  })
})

describe('formatLayout', () => {
  test('returns null for no layout', () => {
    expect(formatLayout({} as any)).toBeNull()
    expect(formatLayout({ layoutMode: 'NONE' } as any)).toBeNull()
  })

  test('formats horizontal layout', () => {
    expect(formatLayout({ layoutMode: 'HORIZONTAL' } as any)).toBe('layout: row')
  })

  test('formats vertical layout with gap', () => {
    expect(formatLayout({ layoutMode: 'VERTICAL', itemSpacing: 8 } as any)).toBe(
      'layout: col gap=8'
    )
  })
})

describe('installHint', () => {
  test('defaults to npm', () => {
    const original = process.env.npm_config_user_agent
    delete process.env.npm_config_user_agent
    expect(installHint('foo')).toBe('npm install -D foo')
    if (original) process.env.npm_config_user_agent = original
  })

  test('detects bun', () => {
    const original = process.env.npm_config_user_agent
    process.env.npm_config_user_agent = 'bun/1.0.0'
    expect(installHint('foo')).toBe('bun add -d foo')
    if (original) process.env.npm_config_user_agent = original
    else delete process.env.npm_config_user_agent
  })

  test('detects pnpm', () => {
    const original = process.env.npm_config_user_agent
    process.env.npm_config_user_agent = 'pnpm/8.0.0'
    expect(installHint('foo')).toBe('pnpm add -D foo')
    if (original) process.env.npm_config_user_agent = original
    else delete process.env.npm_config_user_agent
  })

  test('detects yarn', () => {
    const original = process.env.npm_config_user_agent
    process.env.npm_config_user_agent = 'yarn/4.0.0'
    expect(installHint('foo')).toBe('yarn add -D foo')
    if (original) process.env.npm_config_user_agent = original
    else delete process.env.npm_config_user_agent
  })
})

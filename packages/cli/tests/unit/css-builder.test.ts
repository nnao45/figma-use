import { describe, test, expect } from 'bun:test'

import {
  createFontFace,
  createFontFaceSrc,
  createRule,
  createRoot,
  googleFontsUrl,
  googleFontsImport
} from '../../src/css-builder.ts'

describe('createFontFaceSrc', () => {
  test('creates single source', () => {
    const result = createFontFaceSrc([{ url: './fonts/Inter.woff2', format: 'woff2' }])
    expect(result).toBe("url('./fonts/Inter.woff2') format('woff2')")
  })

  test('creates multiple sources', () => {
    const result = createFontFaceSrc([
      { url: './fonts/Inter.woff2', format: 'woff2' },
      { url: './fonts/Inter.woff', format: 'woff' }
    ])
    expect(result).toContain("url('./fonts/Inter.woff2') format('woff2')")
    expect(result).toContain("url('./fonts/Inter.woff') format('woff')")
    expect(result).toContain(', ')
  })
})

describe('createFontFace', () => {
  test('creates @font-face with all properties', () => {
    const rule = createFontFace({
      family: 'Inter',
      weight: 400,
      style: 'normal',
      src: "url('./fonts/Inter.woff2') format('woff2')"
    })
    const css = rule.toString()
    expect(css).toContain('@font-face')
    expect(css).toContain("font-family: 'Inter'")
    expect(css).toContain('font-weight: 400')
    expect(css).toContain('font-style: normal')
    expect(css).toContain('font-display: swap')
  })

  test('uses default display swap', () => {
    const rule = createFontFace({
      family: 'Roboto',
      weight: 700,
      src: 'url(test)'
    })
    expect(rule.toString()).toContain('font-display: swap')
  })

  test('allows custom display', () => {
    const rule = createFontFace({
      family: 'Roboto',
      weight: 700,
      src: 'url(test)',
      display: 'block'
    })
    expect(rule.toString()).toContain('font-display: block')
  })
})

describe('createRule', () => {
  test('creates CSS rule with declarations', () => {
    const rule = createRule('.my-class', {
      color: 'red',
      'font-size': '16px',
      opacity: 0.5
    })
    const css = rule.toString()
    expect(css).toContain('.my-class')
    expect(css).toContain('color: red')
    expect(css).toContain('font-size: 16px')
    expect(css).toContain('opacity: 0.5')
  })
})

describe('createRoot', () => {
  test('creates empty root', () => {
    const root = createRoot()
    expect(root.toString()).toBe('')
  })

  test('appends rules', () => {
    const root = createRoot()
    root.append(createRule('body', { margin: 0 }))
    expect(root.toString()).toContain('body')
    expect(root.toString()).toContain('margin: 0')
  })
})

describe('googleFontsUrl', () => {
  test('creates URL for single font', () => {
    const url = googleFontsUrl([{ family: 'Inter', weights: [400, 700] }])
    expect(url).toContain('fonts.googleapis.com/css2')
    expect(url).toContain('family=Inter')
    expect(url).toContain('wght@400;700')
    expect(url).toContain('display=swap')
  })

  test('sorts weights', () => {
    const url = googleFontsUrl([{ family: 'Inter', weights: [700, 400, 300] }])
    expect(url).toContain('wght@300;400;700')
  })

  test('handles multiple fonts', () => {
    const url = googleFontsUrl([
      { family: 'Inter', weights: [400] },
      { family: 'Roboto', weights: [700] }
    ])
    expect(url).toContain('family=Inter')
    expect(url).toContain('family=Roboto')
  })

  test('handles italic flag', () => {
    const url = googleFontsUrl([{ family: 'Inter', weights: [400, 700], italic: true }])
    expect(url).toContain('ital,wght@')
    expect(url).toContain('0,400')
    expect(url).toContain('1,400')
  })

  test('encodes spaces in family name', () => {
    const url = googleFontsUrl([{ family: 'Open Sans', weights: [400] }])
    expect(url).toContain('Open%20Sans')
  })
})

describe('googleFontsImport', () => {
  test('creates @import rule', () => {
    const rule = googleFontsImport([{ family: 'Inter', weights: [400] }])
    expect(rule.toString()).toContain('@import')
    expect(rule.toString()).toContain('fonts.googleapis.com')
  })
})

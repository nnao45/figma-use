import { describe, test, expect } from 'bun:test'

import { formatResult } from '../../src/output.ts'

describe('formatResult', () => {
  test('returns empty string for null/undefined', () => {
    expect(formatResult(null)).toBe('')
    expect(formatResult(undefined)).toBe('')
  })

  test('returns string as-is', () => {
    expect(formatResult('hello')).toBe('hello')
  })

  test('returns (empty) for empty array', () => {
    expect(formatResult([])).toBe('(empty)')
  })

  test('formats deleted result', () => {
    const result = formatResult({ deleted: true })
    expect(result).toContain('Deleted')
  })

  test('formats failed delete', () => {
    const result = formatResult({ deleted: false })
    expect(result).toContain('Delete failed')
  })

  test('formats updated result', () => {
    const result = formatResult({ updated: true })
    expect(result).toContain('Updated')
  })

  test('formats export result', () => {
    const result = formatResult({ data: 'base64...', filename: '/tmp/out.png' }, 'export')
    expect(result).toContain('/tmp/out.png')
  })

  test('formats status connected', () => {
    const result = formatResult({ pluginConnected: true })
    expect(result).toContain('connected')
  })

  test('formats status disconnected', () => {
    const result = formatResult({ pluginConnected: false })
    expect(result).toContain('not connected')
  })

  test('formats node with type and id', () => {
    const result = formatResult({
      id: '1:2',
      type: 'FRAME',
      name: 'MyFrame',
      width: 100,
      height: 50
    })
    expect(result).toContain('frame')
    expect(result).toContain('MyFrame')
    expect(result).toContain('1:2')
  })

  test('formats node in create context', () => {
    const result = formatResult({ id: '1:2', type: 'RECTANGLE', name: 'Box' }, 'create')
    expect(result).toContain('Created')
    expect(result).toContain('rect')
    expect(result).toContain('Box')
  })

  test('formats page without type', () => {
    const result = formatResult({ id: '0:1', name: 'Page 1' })
    expect(result).toContain('Page 1')
    expect(result).toContain('0:1')
  })

  test('formats viewport zoom', () => {
    const result = formatResult({ center: { x: 0, y: 0 }, zoom: 0.5 })
    expect(result).toContain('50%')
  })

  test('formats empty selection', () => {
    const result = formatResult({ selection: [] })
    expect(result).toBe('(no selection)')
  })

  test('formats selection list', () => {
    const result = formatResult({ selection: ['1:1', '1:2'] })
    expect(result).toContain('1:1')
    expect(result).toContain('1:2')
  })

  test('formats selected count', () => {
    const result = formatResult({ selected: 3 })
    expect(result).toContain('3 nodes')
  })

  test('formats selected singular', () => {
    const result = formatResult({ selected: 1 })
    expect(result).toContain('1 node')
    expect(result).not.toContain('nodes')
  })

  test('falls back to JSON for unknown objects', () => {
    const result = formatResult({ foo: 'bar' })
    expect(result).toContain('"foo"')
    expect(result).toContain('"bar"')
  })

  test('converts non-object primitives to string', () => {
    expect(formatResult(42)).toBe('42')
    expect(formatResult(true)).toBe('true')
  })

  test('formats array of nodes as list', () => {
    const result = formatResult([
      { id: '1:1', type: 'FRAME', name: 'A' },
      { id: '1:2', type: 'TEXT', name: 'B' }
    ])
    expect(result).toContain('A')
    expect(result).toContain('B')
  })

  test('formats array of pages', () => {
    const result = formatResult([
      { id: '0:1', name: 'Page 1' },
      { id: '0:2', name: 'Page 2' }
    ])
    expect(result).toContain('Page 1')
    expect(result).toContain('Page 2')
  })
})

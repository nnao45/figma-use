import { describe, test, expect } from 'bun:test'

import { isTreeNode, node } from '../../src/render/tree.ts'

describe('isTreeNode', () => {
  test('returns true for valid tree node', () => {
    expect(isTreeNode({ type: 'Frame', props: {}, children: [] })).toBe(true)
  })

  test('returns false for null', () => {
    expect(isTreeNode(null)).toBe(false)
  })

  test('returns false for non-object', () => {
    expect(isTreeNode('string')).toBe(false)
    expect(isTreeNode(42)).toBe(false)
    expect(isTreeNode(undefined)).toBe(false)
  })

  test('returns false without type', () => {
    expect(isTreeNode({ props: {}, children: [] })).toBe(false)
  })

  test('returns false without children array', () => {
    expect(isTreeNode({ type: 'Frame', props: {} })).toBe(false)
    expect(isTreeNode({ type: 'Frame', props: {}, children: 'not-array' })).toBe(false)
  })

  test('returns false without props', () => {
    expect(isTreeNode({ type: 'Frame', children: [] })).toBe(false)
  })
})

describe('node', () => {
  test('creates tree node with type and props', () => {
    const result = node('Frame', { name: 'MyFrame' })
    expect(result.type).toBe('Frame')
    expect(result.props).toEqual({ name: 'MyFrame' })
    expect(result.children).toEqual([])
  })

  test('processes string children', () => {
    const result = node('Text', { children: 'Hello' })
    expect(result.children).toEqual(['Hello'])
  })

  test('processes number children', () => {
    const result = node('Text', { children: 42 as any })
    expect(result.children).toEqual(['42'])
  })

  test('processes nested tree node children', () => {
    const child = { type: 'Rect', props: {}, children: [] }
    const result = node('Frame', { children: child as any })
    expect(result.children).toHaveLength(1)
    expect((result.children[0] as any).type).toBe('Rect')
  })

  test('filters null/undefined children', () => {
    const result = node('Frame', { children: [null, undefined, 'text'] as any })
    expect(result.children).toEqual(['text'])
  })

  test('flattens nested arrays', () => {
    const result = node('Frame', { children: [['a', 'b'], 'c'] as any })
    expect(result.children).toEqual(['a', 'b', 'c'])
  })

  test('excludes children from props', () => {
    const result = node('Frame', { name: 'Test', children: 'child' })
    expect(result.props).toEqual({ name: 'Test' })
    expect(result.props).not.toHaveProperty('children')
  })
})

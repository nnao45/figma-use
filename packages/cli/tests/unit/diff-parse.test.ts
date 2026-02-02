import { describe, test, expect } from 'bun:test'

import { parseFigmaPatch, buildPatch } from '../../src/commands/diff/parse.ts'

describe('buildPatch', () => {
  test('builds unified diff format', () => {
    const patch = buildPatch('/Frame/Rect', '1:2', 'type: RECTANGLE\nopacity: 0.5', 'type: RECTANGLE\nopacity: 1')
    expect(patch).toContain('--- /Frame/Rect #1:2')
    expect(patch).toContain('+++ /Frame/Rect #1:2')
    expect(patch).toContain('@@ -1,2 +1,2 @@')
    expect(patch).toContain('-type: RECTANGLE')
    expect(patch).toContain('-opacity: 0.5')
    expect(patch).toContain('+type: RECTANGLE')
    expect(patch).toContain('+opacity: 1')
  })

  test('handles empty old content (create)', () => {
    const patch = buildPatch('/New', '1:3', '', 'type: FRAME')
    expect(patch).toContain('@@ -1,0 +1,1 @@')
    expect(patch).toContain('+type: FRAME')
  })

  test('handles empty new content (delete)', () => {
    const patch = buildPatch('/Old', '1:4', 'type: FRAME', '')
    expect(patch).toContain('@@ -1,1 +1,0 @@')
    expect(patch).toContain('-type: FRAME')
  })
})

describe('parseFigmaPatch', () => {
  test('parses single patch', () => {
    const patchText = buildPatch('/Frame/Rect', '1:2', 'type: RECTANGLE\nopacity: 0.5', 'type: RECTANGLE\nopacity: 1')
    const patches = parseFigmaPatch(patchText)
    expect(patches).toHaveLength(1)
    expect(patches[0].path).toBe('/Frame/Rect')
    expect(patches[0].nodeId).toBe('1:2')
    expect(patches[0].oldContent).toContain('opacity: 0.5')
    expect(patches[0].newContent).toContain('opacity: 1')
  })

  test('detects create operation', () => {
    const patchText = [
      '--- /dev/null',
      '+++ /New #1:3',
      '@@ -0,0 +1,1 @@',
      '+type: FRAME'
    ].join('\n')
    const patches = parseFigmaPatch(patchText)
    expect(patches).toHaveLength(1)
    expect(patches[0].isCreate).toBe(true)
    expect(patches[0].isDelete).toBe(false)
  })

  test('detects delete operation', () => {
    const patchText = [
      '--- /Old #1:4',
      '+++ /dev/null',
      '@@ -1,1 +0,0 @@',
      '-type: FRAME'
    ].join('\n')
    const patches = parseFigmaPatch(patchText)
    expect(patches).toHaveLength(1)
    expect(patches[0].isDelete).toBe(true)
    expect(patches[0].isCreate).toBe(false)
  })

  test('reconstructs old and new content from context lines', () => {
    const patchText = [
      '--- /Frame #1:1',
      '+++ /Frame #1:1',
      '@@ -1,3 +1,3 @@',
      ' type: FRAME',
      '-opacity: 0.5',
      '+opacity: 1',
      ' size: 100 50'
    ].join('\n')
    const patches = parseFigmaPatch(patchText)
    expect(patches[0].oldContent).toContain('type: FRAME')
    expect(patches[0].oldContent).toContain('opacity: 0.5')
    expect(patches[0].oldContent).toContain('size: 100 50')
    expect(patches[0].newContent).toContain('type: FRAME')
    expect(patches[0].newContent).toContain('opacity: 1')
    expect(patches[0].newContent).toContain('size: 100 50')
  })

  test('handles path without node ID', () => {
    const patchText = [
      '--- /SomePath',
      '+++ /SomePath',
      '@@ -1,1 +1,1 @@',
      '-old',
      '+new'
    ].join('\n')
    const patches = parseFigmaPatch(patchText)
    expect(patches[0].path).toBe('/SomePath')
    expect(patches[0].nodeId).toBeNull()
  })
})

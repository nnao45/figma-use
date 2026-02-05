import { describe, test, expect } from 'bun:test'

import { serializeNode, deserializeNode, diffProps } from '../../src/commands/diff/serialize.ts'

describe('serializeNode', () => {
  test('serializes type', () => {
    const result = serializeNode({ type: 'RECTANGLE' })
    expect(result).toBe('type: RECTANGLE')
  })

  test('serializes size', () => {
    const result = serializeNode({ type: 'FRAME', width: 100, height: 50 })
    expect(result).toContain('size: 100 50')
  })

  test('serializes position', () => {
    const result = serializeNode({ type: 'FRAME', x: 10, y: 20 })
    expect(result).toContain('pos: 10 20')
  })

  test('serializes fill', () => {
    const result = serializeNode({
      type: 'RECTANGLE',
      fills: [{ type: 'SOLID', color: '#FF0000' }]
    })
    expect(result).toContain('fill: #FF0000')
  })

  test('serializes stroke', () => {
    const result = serializeNode({
      type: 'RECTANGLE',
      strokes: [{ type: 'SOLID', color: '#000000' }],
      strokeWeight: 2
    })
    expect(result).toContain('stroke: #000000')
    expect(result).toContain('strokeWeight: 2')
  })

  test('serializes opacity (non-1)', () => {
    const result = serializeNode({ type: 'RECTANGLE', opacity: 0.5 })
    expect(result).toContain('opacity: 0.5')
  })

  test('omits opacity when 1', () => {
    const result = serializeNode({ type: 'RECTANGLE', opacity: 1 })
    expect(result).not.toContain('opacity')
  })

  test('serializes corner radius', () => {
    const result = serializeNode({ type: 'RECTANGLE', cornerRadius: 8 })
    expect(result).toContain('radius: 8')
  })

  test('serializes individual radii when different', () => {
    const result = serializeNode({
      type: 'RECTANGLE',
      topLeftRadius: 4,
      topRightRadius: 8,
      bottomLeftRadius: 0,
      bottomRightRadius: 12
    })
    expect(result).toContain('radii: 4 8 12 0')
  })

  test('serializes uniform individual radii as single radius', () => {
    const result = serializeNode({
      type: 'RECTANGLE',
      topLeftRadius: 8,
      topRightRadius: 8,
      bottomLeftRadius: 8,
      bottomRightRadius: 8
    })
    expect(result).toContain('radius: 8')
    expect(result).not.toContain('radii:')
  })

  test('serializes blend mode (non-default)', () => {
    const result = serializeNode({ type: 'RECTANGLE', blendMode: 'MULTIPLY' })
    expect(result).toContain('blendMode: MULTIPLY')
  })

  test('omits default blend modes', () => {
    expect(serializeNode({ type: 'RECTANGLE', blendMode: 'PASS_THROUGH' })).not.toContain(
      'blendMode'
    )
    expect(serializeNode({ type: 'RECTANGLE', blendMode: 'NORMAL' })).not.toContain('blendMode')
  })

  test('serializes rotation', () => {
    const result = serializeNode({ type: 'RECTANGLE', rotation: 45 })
    expect(result).toContain('rotation: 45')
  })

  test('serializes clipsContent', () => {
    const result = serializeNode({ type: 'FRAME', clipsContent: true })
    expect(result).toContain('clipsContent: true')
  })

  test('serializes effects', () => {
    const result = serializeNode({
      type: 'RECTANGLE',
      effects: [{ type: 'DROP_SHADOW', radius: 4, color: '#000', offset: { x: 0, y: 2 } }]
    })
    expect(result).toContain('effect: DROP_SHADOW r=4 c=#000 x=0 y=2')
  })

  test('serializes text properties', () => {
    const result = serializeNode({
      type: 'TEXT',
      characters: 'Hello World',
      fontSize: 16,
      fontName: { family: 'Inter', style: 'Regular' }
    })
    expect(result).toContain('text: "Hello World"')
    expect(result).toContain('fontSize: 16')
    expect(result).toContain('fontFamily: Inter')
  })

  test('serializes visibility', () => {
    const result = serializeNode({ type: 'RECTANGLE', visible: false })
    expect(result).toContain('visible: false')
  })

  test('serializes locked', () => {
    const result = serializeNode({ type: 'RECTANGLE', locked: true })
    expect(result).toContain('locked: true')
  })

  test('serializes vector paths', () => {
    const result = serializeNode({
      type: 'VECTOR',
      vectorPaths: [{ data: 'M 0 0 L 10 10' }]
    })
    expect(result).toContain('path: M 0 0 L 10 10')
  })
})

describe('deserializeNode', () => {
  test('deserializes type', () => {
    const result = deserializeNode('type: RECTANGLE')
    expect(result.type).toBe('RECTANGLE')
  })

  test('deserializes size', () => {
    const result = deserializeNode('type: FRAME\nsize: 100 50')
    expect(result.size).toEqual([100, 50])
  })

  test('deserializes position', () => {
    const result = deserializeNode('type: FRAME\npos: 10 20')
    expect(result.pos).toEqual([10, 20])
  })

  test('deserializes fill and stroke', () => {
    const result = deserializeNode(
      'type: RECTANGLE\nfill: #FF0000\nstroke: #000000\nstrokeWeight: 2'
    )
    expect(result.fill).toBe('#FF0000')
    expect(result.stroke).toBe('#000000')
    expect(result.strokeWeight).toBe(2)
  })

  test('deserializes opacity', () => {
    const result = deserializeNode('type: RECTANGLE\nopacity: 0.5')
    expect(result.opacity).toBe(0.5)
  })

  test('deserializes radius and radii', () => {
    expect(deserializeNode('type: RECTANGLE\nradius: 8').radius).toBe(8)
    expect(deserializeNode('type: RECTANGLE\nradii: 4 8 12 0').radii).toEqual([4, 8, 12, 0])
  })

  test('deserializes blend mode and rotation', () => {
    const result = deserializeNode('type: RECTANGLE\nblendMode: MULTIPLY\nrotation: 45')
    expect(result.blendMode).toBe('MULTIPLY')
    expect(result.rotation).toBe(45)
  })

  test('deserializes clipsContent', () => {
    expect(deserializeNode('type: FRAME\nclipsContent: true').clipsContent).toBe(true)
    expect(deserializeNode('type: FRAME\nclipsContent: false').clipsContent).toBe(false)
  })

  test('deserializes effects', () => {
    const result = deserializeNode('type: RECTANGLE\neffect: DROP_SHADOW r=4 c=#000 x=0 y=2')
    expect(result.effects).toHaveLength(1)
    expect(result.effects![0].type).toBe('DROP_SHADOW')
    expect(result.effects![0].radius).toBe(4)
    expect(result.effects![0].color).toBe('#000')
    expect(result.effects![0].offset).toEqual({ x: 0, y: 2 })
  })

  test('deserializes text properties', () => {
    const result = deserializeNode('type: TEXT\ntext: "Hello"\nfontSize: 16\nfontFamily: Inter')
    expect(result.text).toBe('Hello')
    expect(result.fontSize).toBe(16)
    expect(result.fontFamily).toBe('Inter')
  })

  test('deserializes visibility and locked', () => {
    const result = deserializeNode('type: RECTANGLE\nvisible: false\nlocked: true')
    expect(result.visible).toBe(false)
    expect(result.locked).toBe(true)
  })

  test('deserializes vector paths', () => {
    const result = deserializeNode('type: VECTOR\npath: M 0 0 L 10 10')
    expect(result.vectorPaths).toEqual(['M 0 0 L 10 10'])
  })

  test('round-trips basic node', () => {
    const node = {
      type: 'RECTANGLE',
      width: 100,
      height: 50,
      x: 10,
      y: 20,
      fills: [{ type: 'SOLID', color: '#FF0000' }],
      opacity: 0.8,
      cornerRadius: 8
    }
    const serialized = serializeNode(node)
    const deserialized = deserializeNode(serialized)
    expect(deserialized.type).toBe('RECTANGLE')
    expect(deserialized.size).toEqual([100, 50])
    expect(deserialized.pos).toEqual([10, 20])
    expect(deserialized.fill).toBe('#FF0000')
    expect(deserialized.opacity).toBe(0.8)
    expect(deserialized.radius).toBe(8)
  })
})

describe('diffProps', () => {
  test('detects changed primitive', () => {
    const old = { type: 'RECTANGLE', opacity: 0.5 }
    const next = { type: 'RECTANGLE', opacity: 1 }
    const changes = diffProps(old, next)
    expect(changes.opacity).toBe(1)
    expect(changes.type).toBeUndefined()
  })

  test('detects changed array', () => {
    const old = { type: 'RECTANGLE', size: [100, 50] as [number, number] }
    const next = { type: 'RECTANGLE', size: [200, 100] as [number, number] }
    const changes = diffProps(old, next)
    expect(changes.size).toEqual([200, 100])
  })

  test('returns empty when equal', () => {
    const props = { type: 'RECTANGLE', opacity: 0.5 }
    const changes = diffProps(props, { ...props })
    expect(Object.keys(changes)).toHaveLength(0)
  })

  test('detects new fields', () => {
    const old = { type: 'RECTANGLE' }
    const next = { type: 'RECTANGLE', fill: '#FF0000' }
    const changes = diffProps(old, next)
    expect(changes.fill).toBe('#FF0000')
  })
})

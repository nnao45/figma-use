import { describe, test, expect, beforeAll, afterAll } from 'bun:test'
import { run, trackNode } from '../helpers.ts'

describe('set', () => {
  let testFrameId: string

  beforeAll(async () => {
    const frame = await run('create frame --x 500 --y 700 --width 400 --height 400 --name "Set Tests" --json') as { id: string }
    testFrameId = frame.id
    trackNode(testFrameId)
  })

  afterAll(async () => {
    if (testFrameId) {
      await run(`node delete ${testFrameId} --json`).catch(() => {})
    }
  })

  describe('fill', () => {
    test('changes fill color', async () => {
      const rect = await run(`create rect --x 10 --y 10 --width 60 --height 60 --fill "#AAAAAA" --parent "${testFrameId}" --json`) as any
      trackNode(rect.id)
      const filled = await run(`set fill ${rect.id} "#FF00FF" --json`) as any
      expect(filled.fills[0].color).toBe('#FF00FF')
    })
  })

  describe('stroke', () => {
    test('changes stroke color and weight', async () => {
      const rect = await run(`create rect --x 80 --y 10 --width 60 --height 60 --fill "#FFFFFF" --parent "${testFrameId}" --json`) as any
      trackNode(rect.id)
      const stroked = await run(`set stroke ${rect.id} "#000000" --weight 3 --json`) as any
      expect(stroked.strokes[0].color).toBe('#000000')
      expect(stroked.strokeWeight).toBe(3)
    })
  })

  describe('radius', () => {
    test('sets uniform radius', async () => {
      const rect = await run(`create rect --x 150 --y 10 --width 60 --height 60 --fill "#CCCCCC" --parent "${testFrameId}" --json`) as any
      trackNode(rect.id)
      const result = await run(`set radius ${rect.id} --radius 12 --json`) as any
      expect(result.id).toBe(rect.id)
    })

    test('sets individual corner radii', async () => {
      const rect = await run(`create rect --x 220 --y 10 --width 60 --height 60 --fill "#DDDDDD" --parent "${testFrameId}" --json`) as any
      trackNode(rect.id)
      const result = await run(`set radius ${rect.id} --topLeft 16 --bottomRight 16 --json`) as any
      expect(result.id).toBe(rect.id)
    })
  })

  describe('opacity', () => {
    test('changes opacity', async () => {
      const rect = await run(`create rect --x 10 --y 80 --width 60 --height 60 --fill "#00FF00" --parent "${testFrameId}" --json`) as any
      trackNode(rect.id)
      const result = await run(`set opacity ${rect.id} 0.7 --json`) as any
      expect(result.opacity).toBeCloseTo(0.7, 1)
    })
  })

  describe('rotation', () => {
    test('rotates node', async () => {
      const rect = await run(`create rect --x 80 --y 80 --width 60 --height 60 --fill "#10B981" --parent "${testFrameId}" --json`) as any
      trackNode(rect.id)
      const result = await run(`set rotation ${rect.id} 45 --json`) as any
      expect(result.id).toBe(rect.id)
    })
  })

  describe('visible', () => {
    test('hides and shows node', async () => {
      const rect = await run(`create rect --x 150 --y 80 --width 60 --height 60 --fill "#FF0000" --parent "${testFrameId}" --json`) as any
      trackNode(rect.id)
      const hidden = await run(`set visible ${rect.id} false --json`) as any
      expect(hidden.visible).toBe(false)
      const shown = await run(`set visible ${rect.id} true --json`) as any
      expect(shown.visible).not.toBe(false)
    })
  })

  describe('text', () => {
    test('changes text content', async () => {
      const text = await run(`create text --x 10 --y 160 --text "Original" --fontSize 16 --parent "${testFrameId}" --json`) as any
      trackNode(text.id)
      const result = await run(`set text ${text.id} "Updated" --json`) as any
      expect(result.characters).toBe('Updated')
    })
  })

  describe('font', () => {
    test('changes font properties', async () => {
      const text = await run(`create text --x 10 --y 200 --text "Font Test" --fontSize 16 --parent "${testFrameId}" --json`) as any
      trackNode(text.id)
      const result = await run(`set font ${text.id} --family "Inter" --style "Bold" --size 20 --json`) as any
      expect(result.fontSize).toBe(20)
    })
  })

  describe('effect', () => {
    test('adds drop shadow', async () => {
      const rect = await run(`create rect --x 220 --y 80 --width 80 --height 80 --fill "#FFFFFF" --parent "${testFrameId}" --json`) as any
      trackNode(rect.id)
      const result = await run(`set effect ${rect.id} --type DROP_SHADOW --color "#00000040" --offsetY 4 --radius 8 --json`) as any
      expect(result.id).toBe(rect.id)
    })
  })

  describe('layout', () => {
    test('enables auto-layout', async () => {
      const frame = await run(`create frame --x 10 --y 260 --width 200 --height 100 --fill "#EEEEEE" --parent "${testFrameId}" --json`) as any
      trackNode(frame.id)
      const result = await run(`set layout ${frame.id} --mode HORIZONTAL --gap 12 --padding 8 --json`) as any
      expect(result.layoutMode).toBe('HORIZONTAL')
      expect(result.itemSpacing).toBe(12)
    })
  })

  describe('blend', () => {
    test('sets blend mode', async () => {
      const rect = await run(`create rect --x 220 --y 170 --width 60 --height 60 --fill "#FFC0CB" --parent "${testFrameId}" --json`) as any
      trackNode(rect.id)
      const result = await run(`set blend ${rect.id} MULTIPLY --json`) as any
      expect(result.id).toBe(rect.id)
    })
  })

  describe('constraints', () => {
    test('sets resize constraints', async () => {
      const rect = await run(`create rect --x 290 --y 80 --width 60 --height 60 --fill "#00FF00" --parent "${testFrameId}" --json`) as any
      trackNode(rect.id)
      const result = await run(`set constraints ${rect.id} --horizontal CENTER --vertical MAX --json`) as any
      expect(result.id).toBe(rect.id)
    })
  })
})

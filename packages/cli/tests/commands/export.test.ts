import { describe, test, expect, beforeAll, afterAll } from 'bun:test'
import { run, trackNode } from '../helpers.ts'

describe('export', () => {
  let rectId: string

  beforeAll(async () => {
    const rect = await run('create rect --x 1100 --y 0 --width 100 --height 100 --fill "#00FFFF" --json') as any
    rectId = rect.id
    trackNode(rectId)
  })

  afterAll(async () => {
    if (rectId) {
      await run(`node delete ${rectId} --json`).catch(() => {})
    }
  })

  describe('node', () => {
    test('exports as PNG', async () => {
      const result = await run(`export node ${rectId} --format PNG --scale 1 --json`) as any
      expect(result).toHaveProperty('data')
      expect(result.data.length).toBeGreaterThan(0)
    })

    test('exports as SVG', async () => {
      const result = await run(`export node ${rectId} --format SVG --json`) as any
      expect(atob(result.data)).toContain('svg')
    })
  })

  describe('screenshot', () => {
    test('takes screenshot', async () => {
      const result = await run('export screenshot --output /tmp/test-screenshot.png')
      expect(result).toBe('/tmp/test-screenshot.png')
    })
  })
})

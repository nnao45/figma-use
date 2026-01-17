import { describe, test, expect } from 'bun:test'
import { run, trackNode } from '../helpers.ts'

describe('import', () => {
  test('imports SVG', async () => {
    const svg = '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="red"/></svg>'
    const result = await run(`import --svg '${svg}' --x 1600 --y 0 --json`) as any
    trackNode(result.id)
    expect(result.type).toBe('FRAME')
  })
})

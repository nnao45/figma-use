import { describe, test, expect, beforeAll, afterAll } from 'bun:test'
import { run, trackNode, setupTestPage, teardownTestPage } from '../helpers.ts'
import { existsSync, unlinkSync } from 'fs'

describe('export', () => {
  let nodeId: string

  beforeAll(async () => {
    await setupTestPage('export')
    const rect = await run('create rect --x 0 --y 0 --width 100 --height 100 --fill "#FF0000" --json') as any
    nodeId = rect.id
    trackNode(nodeId)
  })

  afterAll(async () => {
    await teardownTestPage()
    // Cleanup export files
    for (const f of ['/tmp/test-export.png', '/tmp/test-export.svg']) {
      if (existsSync(f)) unlinkSync(f)
    }
  })

  test('node exports to PNG', async () => {
    const output = await run(`export node ${nodeId} --output /tmp/test-export.png`, false) as string
    expect(output).toContain('/tmp/test-export.png')
    expect(existsSync('/tmp/test-export.png')).toBe(true)
  })

  test('node exports to SVG', async () => {
    const output = await run(`export node ${nodeId} --output /tmp/test-export.svg --format svg`, false) as string
    expect(output).toContain('/tmp/test-export.svg')
    expect(existsSync('/tmp/test-export.svg')).toBe(true)
  })
})

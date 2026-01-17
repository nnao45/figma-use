import { describe, test, expect, beforeAll, afterAll } from 'bun:test'
import { run, trackNode } from '../helpers.ts'

describe('selection', () => {
  let nodeId: string

  beforeAll(async () => {
    const rect = await run('create rect --x 1000 --y 0 --width 60 --height 60 --fill "#00FFFF" --json') as any
    nodeId = rect.id
    trackNode(nodeId)
  })

  afterAll(async () => {
    if (nodeId) {
      await run(`node delete ${nodeId} --json`).catch(() => {})
    }
  })

  test('set selects nodes', async () => {
    const result = await run(`selection set ${nodeId} --json`) as any
    expect(result.selected).toBe(1)
  })

  test('get returns selected nodes', async () => {
    await run(`selection set ${nodeId} --json`)
    const result = await run('selection get --json') as any[]
    expect(Array.isArray(result)).toBe(true)
  })
})

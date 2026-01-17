import { describe, test, expect, beforeAll } from 'bun:test'
import { run, trackNode } from '../helpers.ts'

describe('viewport', () => {
  let frameId: string

  beforeAll(async () => {
    const frame = await run('create frame --x 0 --y 1100 --width 200 --height 200 --fill "#EEEEEE" --json') as any
    frameId = frame.id
    trackNode(frameId)
  })

  test('get returns viewport info', async () => {
    const vp = await run('viewport get --json') as any
    expect(vp).toHaveProperty('center')
    expect(vp).toHaveProperty('zoom')
  })

  test('zoom-to-fit zooms to nodes', async () => {
    const result = await run(`viewport zoom-to-fit ${frameId} --json`) as any
    expect(result).toHaveProperty('center')
    expect(result).toHaveProperty('zoom')
  })
})

import { describe, test, expect } from 'bun:test'
import { run, trackNode } from '../helpers.ts'

describe('group', () => {
  test('create groups nodes together', async () => {
    const r1 = await run('create rect --x 1350 --y 0 --width 40 --height 40 --fill "#FF0000" --json') as any
    const r2 = await run('create rect --x 1400 --y 0 --width 40 --height 40 --fill "#00FF00" --json') as any
    
    const group = await run(`group create "${r1.id},${r2.id}" --json`) as any
    trackNode(group.id)
    expect(group.type).toBe('GROUP')
  })

  test('ungroup removes group', async () => {
    const r1 = await run('create rect --x 1350 --y 50 --width 30 --height 30 --fill "#0000FF" --json') as any
    const r2 = await run('create rect --x 1390 --y 50 --width 30 --height 30 --fill "#FFFF00" --json') as any
    
    const group = await run(`group create "${r1.id},${r2.id}" --json`) as any
    const result = await run(`group ungroup ${group.id} --json`) as any[]
    expect(Array.isArray(result)).toBe(true)
    expect(result.length).toBe(2)
  })
})

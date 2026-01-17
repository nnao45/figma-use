import { describe, test, expect } from 'bun:test'
import { run, trackNode } from '../helpers.ts'

describe('boolean', () => {
  test('union combines shapes', async () => {
    const r1 = await run('create rect --x 1450 --y 0 --width 60 --height 60 --fill "#0000FF" --json') as any
    const r2 = await run('create rect --x 1480 --y 30 --width 60 --height 60 --fill "#0000FF" --json') as any
    
    const union = await run(`boolean union "${r1.id},${r2.id}" --json`) as any
    trackNode(union.id)
    expect(union.type).toBe('BOOLEAN_OPERATION')
  })

  test('subtract removes shapes', async () => {
    const r1 = await run('create rect --x 1550 --y 0 --width 60 --height 60 --fill "#FF0000" --json') as any
    const r2 = await run('create rect --x 1580 --y 30 --width 30 --height 30 --fill "#FF0000" --json') as any
    
    const subtract = await run(`boolean subtract "${r1.id},${r2.id}" --json`) as any
    trackNode(subtract.id)
    expect(subtract.type).toBe('BOOLEAN_OPERATION')
  })
})

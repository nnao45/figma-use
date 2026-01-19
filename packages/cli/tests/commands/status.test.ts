import { describe, test, expect } from 'bun:test'
import { run } from '../helpers.ts'


describe('status', () => {
  test('returns connected status', async () => {
    const result = (await run('status --json')) as { proxy: boolean; plugin: boolean }
    expect(result.proxy).toBe(true)
    expect(result.plugin).toBe(true)
  })
})

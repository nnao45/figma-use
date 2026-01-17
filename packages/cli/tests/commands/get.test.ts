import { describe, test, expect } from 'bun:test'
import { run } from '../helpers.ts'

describe('get', () => {
  test('pages returns array', async () => {
    const pages = await run('get pages --json') as { id: string; name: string }[]
    expect(Array.isArray(pages)).toBe(true)
    expect(pages.length).toBeGreaterThan(0)
  })

  test('components returns array', async () => {
    const components = await run('get components --json') as any[]
    expect(Array.isArray(components)).toBe(true)
  })

  test('styles returns styles object', async () => {
    const styles = await run('get styles --json') as any
    expect(styles).toHaveProperty('paintStyles')
  })
})

import { describe, test, expect } from 'bun:test'
import { run } from '../helpers.ts'

describe('style', () => {
  test('list returns styles', async () => {
    const styles = await run('style list --json') as any
    expect(styles).toHaveProperty('paintStyles')
  })

  test('create-paint creates color style', async () => {
    const style = await run('style create-paint "Test/Primary" --color "#E11D48" --json') as any
    expect(style.name).toBe('Test/Primary')
  })

  test('create-text creates text style', async () => {
    const style = await run('style create-text "Test/Body" --family "Inter" --style "Regular" --size 16 --json') as any
    expect(style.name).toBe('Test/Body')
  })

  test('create-effect creates effect style', async () => {
    const style = await run('style create-effect "Test/Shadow" --type DROP_SHADOW --color "#00000020" --offsetY 2 --radius 4 --json') as any
    expect(style.name).toBe('Test/Shadow')
  })
})

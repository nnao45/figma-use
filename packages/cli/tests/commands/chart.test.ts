import { describe, test, expect, beforeAll, afterAll } from 'bun:test'

import { run, trackNode, setupTestPage, teardownTestPage } from '../helpers.ts'

describe('chart', () => {
  let testFrameId: string

  beforeAll(async () => {
    await setupTestPage('chart')
    const frame = (await run(
      'create frame --x 0 --y 0 --width 900 --height 600 --name "Chart Tests" --json'
    )) as { id: string }
    testFrameId = frame.id
    trackNode(testFrameId)
  })

  afterAll(async () => {
    await teardownTestPage()
  })

  test('creates scatter chart', async () => {
    const chart = (await run(
      `create chart scatter --data "10:20,30:40,50:60" --x 20 --y 20 --parent "${testFrameId}" --json`
    )) as any
    trackNode(chart.id)
    expect(chart.name).toBe('Scatter Chart')
    expect(chart.width).toBeGreaterThan(0)
    expect(chart.height).toBeGreaterThan(0)
  })

  test('creates bubble chart', async () => {
    const chart = (await run(
      `create chart bubble --data "10:20:30,40:50:20,60:30:50" --x 20 --y 240 --parent "${testFrameId}" --json`
    )) as any
    trackNode(chart.id)
    expect(chart.name).toBe('Bubble Chart')
    expect(chart.width).toBeGreaterThan(0)
    expect(chart.height).toBeGreaterThan(0)
  })
})

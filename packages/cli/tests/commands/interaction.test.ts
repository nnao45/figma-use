import { describe, test, expect, beforeAll, afterAll } from 'bun:test'

import { run, trackNode, setupTestPage, teardownTestPage } from '../helpers.ts'

describe('interaction', () => {
  let frameAId: string
  let frameBId: string
  let buttonId: string

  beforeAll(async () => {
    await setupTestPage('interaction')

    const frameA = (await run(
      'create frame --x 0 --y 0 --width 600 --height 400 --name "Frame A" --json'
    )) as { id: string }
    frameAId = frameA.id
    trackNode(frameAId)

    const frameB = (await run(
      'create frame --x 700 --y 0 --width 600 --height 400 --name "Frame B" --json'
    )) as { id: string }
    frameBId = frameB.id
    trackNode(frameBId)

    const button = (await run(
      `create rect --x 40 --y 40 --width 120 --height 48 --name "Button" --parent "${frameAId}" --json`
    )) as { id: string }
    buttonId = button.id
    trackNode(buttonId)
  })

  afterAll(async () => {
    await teardownTestPage()
  })

  test('list returns empty when no interactions', async () => {
    const result = (await run(`interaction list "${buttonId}" --json`)) as any[]
    expect(Array.isArray(result)).toBe(true)
    expect(result.length).toBe(0)
  })

  test('add ON_CLICK + NAVIGATE', async () => {
    const result = (await run(
      `interaction add "${buttonId}" --trigger ON_CLICK --action NAVIGATE --destination "${frameBId}" --json`
    )) as any[]
    expect(result.length).toBe(1)
    expect(result[0].trigger.type).toBe('ON_CLICK')
    expect(result[0].actions[0].type).toBe('NODE')
    expect(result[0].actions[0].navigation).toBe('NAVIGATE')
    expect(result[0].actions[0].destinationId).toBe(frameBId)
  })

  test('list shows added interaction', async () => {
    const result = (await run(`interaction list "${buttonId}" --json`)) as any[]
    expect(result.length).toBeGreaterThan(0)
  })

  test('navigate shortcut defaults', async () => {
    const result = (await run(
      `interaction navigate "${buttonId}" "${frameBId}" --json`
    )) as any[]
    const latest = result[result.length - 1]
    expect(latest.trigger.type).toBe('ON_CLICK')
    expect(latest.actions[0].navigation).toBe('NAVIGATE')
    expect(latest.actions[0].transition.type).toBe('DISSOLVE')
  })

  test('overlay shortcut defaults', async () => {
    const result = (await run(
      `interaction overlay "${buttonId}" "${frameBId}" --json`
    )) as any[]
    const latest = result[result.length - 1]
    expect(latest.trigger.type).toBe('ON_HOVER')
    expect(latest.actions[0].navigation).toBe('OVERLAY')
  })

  test('add BACK action', async () => {
    const result = (await run(
      `interaction add "${buttonId}" --trigger ON_CLICK --action BACK --json`
    )) as any[]
    const latest = result[result.length - 1]
    expect(latest.actions[0].type).toBe('BACK')
  })

  test('add URL action', async () => {
    const result = (await run(
      `interaction add "${buttonId}" --trigger ON_CLICK --action URL --url "https://example.com" --json`
    )) as any[]
    const latest = result[result.length - 1]
    expect(latest.actions[0].type).toBe('URL')
    expect(latest.actions[0].url).toBe('https://example.com')
  })

  test('add SMART_ANIMATE transition', async () => {
    const result = (await run(
      `interaction add "${buttonId}" --trigger ON_CLICK --action NAVIGATE --destination "${frameBId}" --transition SMART_ANIMATE --json`
    )) as any[]
    const latest = result[result.length - 1]
    expect(latest.actions[0].transition.type).toBe('SMART_ANIMATE')
  })

  test('add directional transition', async () => {
    const result = (await run(
      `interaction add "${buttonId}" --trigger ON_CLICK --action NAVIGATE --destination "${frameBId}" --transition SLIDE_IN --direction LEFT --json`
    )) as any[]
    const latest = result[result.length - 1]
    expect(latest.actions[0].transition.type).toBe('SLIDE_IN')
    expect(latest.actions[0].transition.direction).toBe('LEFT')
  })

  test('node get includes reactions', async () => {
    const node = (await run(`node get "${buttonId}" --json`)) as any
    expect(Array.isArray(node.reactions)).toBe(true)
    expect(node.reactions.length).toBeGreaterThan(0)
  })

  test('remove by index', async () => {
    const before = (await run(`interaction list "${buttonId}" --json`)) as any[]
    const result = (await run(
      `interaction remove "${buttonId}" --index 0 --json`
    )) as any[]
    expect(result.length).toBe(before.length - 1)
  })

  test('remove all', async () => {
    const result = (await run(`interaction remove "${buttonId}" --all --json`)) as any[]
    expect(result.length).toBe(0)
  })
})

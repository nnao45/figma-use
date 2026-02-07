import { describe, test, expect, beforeAll, afterAll } from 'bun:test'

import { run, trackNode, setupTestPage, teardownTestPage } from '../helpers.ts'

describe('node', () => {
  let testFrameId: string
  let nodeId: string

  beforeAll(async () => {
    await setupTestPage('node')
    const frame = (await run(
      'create frame --x 0 --y 0 --width 400 --height 300 --name "Node Tests" --json'
    )) as { id: string }
    testFrameId = frame.id
    trackNode(testFrameId)

    const rect = (await run(
      `create rect --x 10 --y 10 --width 80 --height 80 --fill "#AAAAAA" --parent "${testFrameId}" --json`
    )) as any
    nodeId = rect.id
    trackNode(nodeId)
  })

  afterAll(async () => {
    await teardownTestPage()
  })

  test('get returns node info', async () => {
    const node = (await run(`node get ${nodeId} --json`)) as any
    expect(node.id).toBe(nodeId)
    expect(node.type).toBe('RECTANGLE')
  })

  test('children returns child nodes', async () => {
    const children = (await run(`node children ${testFrameId} --json`)) as any[]
    expect(Array.isArray(children)).toBe(true)
    expect(children.length).toBeGreaterThan(0)
  })

  test('move changes position', async () => {
    const moved = (await run(`node move ${nodeId} --x 50 --y 50 --json`)) as any
    expect(moved.x).toBe(50)
    expect(moved.y).toBe(50)
  })

  test('resize changes size', async () => {
    const resized = (await run(`node resize ${nodeId} --width 100 --height 100 --json`)) as any
    expect(resized.width).toBe(100)
    expect(resized.height).toBe(100)
  })

  test('rename changes name', async () => {
    const renamed = (await run(`node rename ${nodeId} "RenamedRect" --json`)) as any
    expect(renamed.name).toBe('RenamedRect')
  })

  test('clone duplicates node', async () => {
    const clone = (await run(`node clone ${nodeId} --json`)) as any
    trackNode(clone.id)
    expect(clone.type).toBe('RECTANGLE')
    expect(clone.id).not.toBe(nodeId)
  })

  test('delete removes node', async () => {
    const rect = (await run(
      `create rect --x 200 --y 10 --width 50 --height 50 --parent "${testFrameId}" --json`
    )) as any
    const result = (await run(`node delete ${rect.id} --json`)) as any
    expect(result.deleted).toBe(1)
  })

  test('tree returns formatted tree', async () => {
    const output = (await run(`node tree ${testFrameId}`, false)) as string
    expect(output).toContain('frame')
    expect(output).toContain(testFrameId)
    expect(output).toContain('nodes')
  })

  test('tree with depth limits output', async () => {
    const output = (await run(`node tree ${testFrameId} --depth 0`, false)) as string
    expect(output).toContain('frame')
  })

  test('tree depth affects node count', async () => {
    const frame = (await run(
      'create frame --x 0 --y 400 --width 200 --height 200 --name "TreeDepthTest" --json'
    )) as any
    trackNode(frame.id)
    await run(`create rect --x 10 --y 10 --width 50 --height 50 --parent "${frame.id}" --json`)
    await run(`create rect --x 70 --y 10 --width 50 --height 50 --parent "${frame.id}" --json`)

    const depth0 = (await run(`node tree ${frame.id} --depth 0`, false)) as string
    expect(depth0).toContain('1 nodes')

    const depth1 = (await run(`node tree ${frame.id} --depth 1`, false)) as string
    expect(depth1).toContain('3 nodes')
  })

  test('get shows component properties for instances', async () => {
    const comp = (await run(
      'create component --x 300 --y 400 --width 100 --height 50 --name "PropTestComp" --json'
    )) as any
    trackNode(comp.id)
    const instance = (await run(
      `create instance --component ${comp.id} --x 400 --y 400 --json`
    )) as any
    trackNode(instance.id)

    const node = (await run(`node get ${instance.id} --json`)) as any
    expect(node.type).toBe('INSTANCE')
  })

  test('to-component converts frame to component', async () => {
    const frame = (await run(
      'create frame --x 0 --y 500 --width 100 --height 50 --name "ToCompTest" --json'
    )) as any
    trackNode(frame.id)

    const result = (await run(`node to-component ${frame.id} --json`)) as any[]
    expect(result.length).toBe(1)
    expect(result[0]!.name).toBe('ToCompTest')
    trackNode(result[0]!.id)

    const comp = (await run(`node get ${result[0]!.id} --json`)) as any
    expect(comp.type).toBe('COMPONENT')
  })

  test('to-component converts multiple frames', async () => {
    const frame1 = (await run(
      'create frame --x 150 --y 500 --width 50 --height 50 --name "Multi1" --json'
    )) as any
    const frame2 = (await run(
      'create frame --x 210 --y 500 --width 50 --height 50 --name "Multi2" --json'
    )) as any
    trackNode(frame1.id)
    trackNode(frame2.id)

    const result = (await run(`node to-component "${frame1.id} ${frame2.id}" --json`)) as any[]
    expect(result.length).toBe(2)
    for (const comp of result) {
      trackNode(comp.id)
    }
  })

  test('ancestors returns parent chain', async () => {
    const outer = (await run(
      'create frame --x 0 --y 600 --width 300 --height 300 --name "Outer" --json'
    )) as any
    trackNode(outer.id)

    const inner = (await run(
      `create frame --x 10 --y 10 --width 100 --height 100 --name "Inner" --parent "${outer.id}" --json`
    )) as any
    trackNode(inner.id)

    const rect = (await run(
      `create rect --x 10 --y 10 --width 50 --height 50 --name "DeepRect" --parent "${inner.id}" --json`
    )) as any
    trackNode(rect.id)

    const ancestors = (await run(`node ancestors ${rect.id} --json`)) as any[]
    expect(ancestors.length).toBeGreaterThanOrEqual(3)
    expect(ancestors[0].id).toBe(rect.id)
    expect(ancestors[1].id).toBe(inner.id)
    expect(ancestors[2].id).toBe(outer.id)
  })

  test('ancestors respects depth limit', async () => {
    const ancestors = (await run(`node ancestors ${nodeId} --depth 1 --json`)) as any[]
    expect(ancestors.length).toBe(1)
  })

  test('move with dx/dy applies relative movement', async () => {
    // First set to known position
    await run(`node move ${nodeId} --x 100 --y 100 --json`)
    const moved = (await run(`node move ${nodeId} --dx 30 --dy 20 --json`)) as any
    expect(moved.x).toBe(130)
    expect(moved.y).toBe(120)
  })

  test('move with only dx moves only x', async () => {
    await run(`node move ${nodeId} --x 50 --y 50 --json`)
    const moved = (await run(`node move ${nodeId} --dx 25 --json`)) as any
    expect(moved.x).toBe(75)
    expect(moved.y).toBe(50)
  })

  test('move with only dy moves only y', async () => {
    await run(`node move ${nodeId} --x 50 --y 50 --json`)
    const moved = (await run(`node move ${nodeId} --dy 15 --json`)) as any
    expect(moved.x).toBe(50)
    expect(moved.y).toBe(65)
  })

  test('scale changes size proportionally', async () => {
    // Set to known size
    await run(`node resize ${nodeId} --width 100 --height 50 --json`)
    await run(`node move ${nodeId} --x 0 --y 0 --json`)

    const scaled = (await run(`node scale ${nodeId} --factor 2 --json`)) as any
    expect(scaled.width).toBe(200)
    expect(scaled.height).toBe(100)
  })

  test('scale preserves center position', async () => {
    await run(`node resize ${nodeId} --width 100 --height 100 --json`)
    await run(`node move ${nodeId} --x 100 --y 100 --json`)
    // Center is at (150, 150)

    const scaled = (await run(`node scale ${nodeId} --factor 0.5 --json`)) as any
    expect(scaled.width).toBe(50)
    expect(scaled.height).toBe(50)
    // Center should still be at (150, 150): x=125, y=125
    expect(scaled.x).toBe(125)
    expect(scaled.y).toBe(125)
  })

  test('scale by 1 does not change anything', async () => {
    await run(`node resize ${nodeId} --width 80 --height 60 --json`)
    await run(`node move ${nodeId} --x 10 --y 20 --json`)

    const scaled = (await run(`node scale ${nodeId} --factor 1 --json`)) as any
    expect(scaled.width).toBe(80)
    expect(scaled.height).toBe(60)
    expect(scaled.x).toBe(10)
    expect(scaled.y).toBe(20)
  })

  test('flip x mirrors node horizontally', async () => {
    const rect = (await run(
      `create rect --x 50 --y 50 --width 100 --height 80 --fill "#BBBBBB" --parent "${testFrameId}" --json`
    )) as any
    trackNode(rect.id)

    const flipped = (await run(`node flip ${rect.id} --axis x --json`)) as any
    expect(flipped.id).toBe(rect.id)
  })

  test('flip y mirrors node vertically', async () => {
    const rect = (await run(
      `create rect --x 50 --y 50 --width 100 --height 80 --fill "#CCCCCC" --parent "${testFrameId}" --json`
    )) as any
    trackNode(rect.id)

    const flipped = (await run(`node flip ${rect.id} --axis y --json`)) as any
    expect(flipped.id).toBe(rect.id)
  })

  test('flip x twice restores original transform', async () => {
    const rect = (await run(
      `create rect --x 30 --y 30 --width 60 --height 40 --fill "#DDDDDD" --parent "${testFrameId}" --json`
    )) as any
    trackNode(rect.id)

    // Get original state
    const original = (await run(`node get ${rect.id} --json`)) as any

    // Flip x twice
    await run(`node flip ${rect.id} --axis x --json`)
    const restored = (await run(`node flip ${rect.id} --axis x --json`)) as any

    expect(Math.round(restored.width)).toBe(Math.round(original.width))
    expect(Math.round(restored.height)).toBe(Math.round(original.height))
  })

  test('flip y twice restores original transform', async () => {
    const rect = (await run(
      `create rect --x 30 --y 30 --width 60 --height 40 --fill "#EEEEEE" --parent "${testFrameId}" --json`
    )) as any
    trackNode(rect.id)

    const original = (await run(`node get ${rect.id} --json`)) as any

    await run(`node flip ${rect.id} --axis y --json`)
    const restored = (await run(`node flip ${rect.id} --axis y --json`)) as any

    expect(Math.round(restored.width)).toBe(Math.round(original.width))
    expect(Math.round(restored.height)).toBe(Math.round(original.height))
  })

  test('flip preserves node dimensions', async () => {
    const rect = (await run(
      `create rect --x 10 --y 10 --width 120 --height 60 --fill "#AABBCC" --parent "${testFrameId}" --json`
    )) as any
    trackNode(rect.id)

    const flippedX = (await run(`node flip ${rect.id} --axis x --json`)) as any
    expect(flippedX.width).toBeCloseTo(120)
    expect(flippedX.height).toBeCloseTo(60)

    const flippedY = (await run(`node flip ${rect.id} --axis y --json`)) as any
    expect(flippedY.width).toBeCloseTo(120)
    expect(flippedY.height).toBeCloseTo(60)
  })

  test('scale down with fractional factor', async () => {
    await run(`node resize ${nodeId} --width 200 --height 100 --json`)
    await run(`node move ${nodeId} --x 0 --y 0 --json`)

    const scaled = (await run(`node scale ${nodeId} --factor 0.25 --json`)) as any
    expect(scaled.width).toBeCloseTo(50)
    expect(scaled.height).toBeCloseTo(25)
  })

  test('scale with non-integer factor', async () => {
    await run(`node resize ${nodeId} --width 100 --height 100 --json`)
    await run(`node move ${nodeId} --x 0 --y 0 --json`)

    const scaled = (await run(`node scale ${nodeId} --factor 1.5 --json`)) as any
    expect(scaled.width).toBeCloseTo(150)
    expect(scaled.height).toBeCloseTo(150)
  })

  test('multiple sequential scales compound correctly', async () => {
    await run(`node resize ${nodeId} --width 100 --height 100 --json`)
    await run(`node move ${nodeId} --x 0 --y 0 --json`)

    await run(`node scale ${nodeId} --factor 2 --json`)
    const result = (await run(`node scale ${nodeId} --factor 0.5 --json`)) as any
    // 100 * 2 * 0.5 = 100
    expect(result.width).toBeCloseTo(100)
    expect(result.height).toBeCloseTo(100)
  })

  test('scale rejects zero factor', async () => {
    await expect(run(`node scale ${nodeId} --factor 0 --json`)).rejects.toThrow()
  })

  test('scale rejects negative factor', async () => {
    await expect(run(`node scale ${nodeId} --factor -1 --json`)).rejects.toThrow()
  })

  test('resize then scale preserves proportions', async () => {
    await run(`node resize ${nodeId} --width 60 --height 30 --json`)
    const scaled = (await run(`node scale ${nodeId} --factor 3 --json`)) as any
    // Aspect ratio should remain 2:1
    expect(scaled.width / scaled.height).toBeCloseTo(2)
  })

  test('move with large dx/dy offset', async () => {
    await run(`node move ${nodeId} --x 0 --y 0 --json`)
    const moved = (await run(`node move ${nodeId} --dx 150 --dy 200 --json`)) as any
    expect(moved.x).toBe(150)
    expect(moved.y).toBe(200)
  })

  test('move rejects mixing absolute and relative', async () => {
    await expect(
      run(`node move ${nodeId} --x 100 --dx 10 --json`)
    ).rejects.toThrow()
  })

  test('move rejects no positioning args', async () => {
    await expect(run(`node move ${nodeId} --json`)).rejects.toThrow()
  })

  test('resize to small values', async () => {
    const resized = (await run(`node resize ${nodeId} --width 1 --height 1 --json`)) as any
    expect(resized.width).toBe(1)
    expect(resized.height).toBe(1)
  })

  test('resize to large values', async () => {
    const resized = (await run(`node resize ${nodeId} --width 5000 --height 3000 --json`)) as any
    expect(resized.width).toBe(5000)
    expect(resized.height).toBe(3000)
  })

  test('resize does not change position', async () => {
    await run(`node move ${nodeId} --x 42 --y 77 --json`)
    const resized = (await run(`node resize ${nodeId} --width 200 --height 150 --json`)) as any
    expect(resized.x).toBe(42)
    expect(resized.y).toBe(77)
  })

  test('scale then flip maintains dimensions', async () => {
    const rect = (await run(
      `create rect --x 0 --y 0 --width 100 --height 50 --fill "#112233" --parent "${testFrameId}" --json`
    )) as any
    trackNode(rect.id)

    await run(`node scale ${rect.id} --factor 2 --json`)
    const flipped = (await run(`node flip ${rect.id} --axis x --json`)) as any
    expect(flipped.width).toBeCloseTo(200)
    expect(flipped.height).toBeCloseTo(100)
  })

  test('flip then resize works correctly', async () => {
    const rect = (await run(
      `create rect --x 0 --y 0 --width 80 --height 80 --fill "#334455" --parent "${testFrameId}" --json`
    )) as any
    trackNode(rect.id)

    await run(`node flip ${rect.id} --axis y --json`)
    const resized = (await run(`node resize ${rect.id} --width 160 --height 40 --json`)) as any
    expect(resized.width).toBe(160)
    expect(resized.height).toBe(40)
  })

  test('relative move accumulates correctly', async () => {
    await run(`node move ${nodeId} --x 0 --y 0 --json`)
    await run(`node move ${nodeId} --dx 10 --dy 10 --json`)
    await run(`node move ${nodeId} --dx 20 --dy 30 --json`)
    const result = (await run(`node move ${nodeId} --dx 5 --dy 5 --json`)) as any
    expect(result.x).toBe(35)
    expect(result.y).toBe(45)
  })

  test('flip invalid axis rejects', async () => {
    await expect(
      run(`node flip ${nodeId} --axis z --json`)
    ).rejects.toThrow()
  })

  test('bindings returns empty when no variables', async () => {
    const rect = (await run(
      `create rect --x 300 --y 600 --width 50 --height 50 --fill "#FF0000" --json`
    )) as any
    trackNode(rect.id)

    const bindings = (await run(`node bindings ${rect.id} --json`)) as any
    expect(bindings.id).toBe(rect.id)
    expect(bindings.fills).toBeUndefined()
    expect(bindings.strokes).toBeUndefined()
  })
})

test('replace-with creates instance from component', async () => {
  // Create a frame to replace
  const frame = (await run(
    'create frame --width 50 --height 50 --x 0 --y 900 --fill "#FF0000" --json'
  )) as any

  // Create a component to use as source
  const component = (await run(
    'create frame --width 30 --height 30 --x 100 --y 900 --fill "#00FF00" --json'
  )) as any
  const converted = (await run(`node to-component ${component.id} --json`)) as any[]
  const componentId = converted[0].id

  // Replace frame with component (should create instance)
  const replaced = (await run(
    `node replace-with ${frame.id} --target ${componentId} --json`
  )) as any

  expect(replaced.type).toBe('INSTANCE')
  expect(replaced.x).toBe(frame.x)
  expect(replaced.y).toBe(frame.y)

  // Cleanup
  await run(`node delete ${replaced.id}`)
  await run(`node delete ${componentId}`)
})

test('replace-with clones regular node', async () => {
  // Create two frames
  const frame1 = (await run(
    'create frame --width 50 --height 50 --x 0 --y 900 --fill "#FF0000" --json'
  )) as any

  const frame2 = (await run(
    'create frame --width 80 --height 40 --x 200 --y 900 --fill "#00FF00" --json'
  )) as any

  // Replace frame1 with frame2 (should clone)
  const replaced = (await run(`node replace-with ${frame1.id} --target ${frame2.id} --json`)) as any

  expect(replaced.type).toBe('FRAME')
  expect(replaced.x).toBe(frame1.x)
  expect(replaced.y).toBe(frame1.y)

  // Cleanup
  await run(`node delete ${replaced.id}`)
  await run(`node delete ${frame2.id}`)
})

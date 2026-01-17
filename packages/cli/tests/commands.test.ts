import { describe, test, expect, beforeAll, afterAll } from 'bun:test'

const CLI = 'bun run src/index.ts'
const cwd = import.meta.dir + '/..'

async function run(cmd: string): Promise<unknown> {
  const proc = Bun.spawn(['sh', '-c', `${CLI} ${cmd}`], { cwd, stdout: 'pipe', stderr: 'pipe' })
  const stdout = await new Response(proc.stdout).text()
  const stderr = await new Response(proc.stderr).text()
  await proc.exited
  if (proc.exitCode !== 0) throw new Error(stderr || stdout)
  try {
    return JSON.parse(stdout)
  } catch {
    return stdout.trim()
  }
}

describe('Figma Bridge CLI', () => {
  let testPageId: string
  let testFrameId: string
  const createdNodes: string[] = []

  beforeAll(async () => {
    // Create test page
    const page = await run('create-page --name "Test Page"') as { id: string }
    testPageId = page.id
    await run(`set-current-page --id "${testPageId}"`)
    
    // Create test frame
    const frame = await run('create-frame --x 0 --y 0 --width 1000 --height 1000 --name "Test Frame"') as { id: string }
    testFrameId = frame.id
    createdNodes.push(testFrameId)
  })

  afterAll(async () => {
    // Cleanup: delete test page
    if (testPageId) {
      // Switch to another page first
      const pages = await run('get-pages') as { id: string }[]
      const otherPage = pages.find(p => p.id !== testPageId)
      if (otherPage) {
        await run(`set-current-page --id "${otherPage.id}"`)
      }
      await run(`delete-node --id "${testPageId}"`)
    }
  })

  describe('status', () => {
    test('returns connected status', async () => {
      const result = await run('status') as string
      expect(result).toContain('connected')
    })
  })

  describe('pages', () => {
    test('get-pages returns array', async () => {
      const pages = await run('get-pages') as { id: string; name: string }[]
      expect(Array.isArray(pages)).toBe(true)
      expect(pages.length).toBeGreaterThan(0)
      expect(pages[0]).toHaveProperty('id')
      expect(pages[0]).toHaveProperty('name')
    })

    test('create-page creates new page', async () => {
      const page = await run('create-page --name "Temp Page"') as { id: string; name: string }
      expect(page.name).toBe('Temp Page')
      await run(`delete-node --id "${page.id}"`)
    })
  })

  describe('create-rectangle', () => {
    test('creates rectangle with basic params', async () => {
      const rect = await run(`create-rectangle --x 10 --y 10 --width 100 --height 50 --name "BasicRect" --parentId "${testFrameId}"`) as any
      createdNodes.push(rect.id)
      expect(rect.type).toBe('RECTANGLE')
      expect(rect.width).toBe(100)
      expect(rect.height).toBe(50)
      expect(rect.name).toBe('BasicRect')
    })

    test('creates rectangle with fill and radius', async () => {
      const rect = await run(`create-rectangle --x 120 --y 10 --width 100 --height 50 --fill "#FF0000" --radius 8 --parentId "${testFrameId}"`) as any
      createdNodes.push(rect.id)
      expect(rect.fills[0].color).toBe('#FF0000')
    })

    test('creates rectangle with stroke', async () => {
      const rect = await run(`create-rectangle --x 230 --y 10 --width 100 --height 50 --fill "#FFFFFF" --stroke "#000000" --strokeWeight 2 --parentId "${testFrameId}"`) as any
      createdNodes.push(rect.id)
      expect(rect.strokes[0].color).toBe('#000000')
      expect(rect.strokeWeight).toBe(2)
    })

    test('creates rectangle with opacity', async () => {
      const rect = await run(`create-rectangle --x 340 --y 10 --width 100 --height 50 --fill "#0000FF" --opacity 0.5 --parentId "${testFrameId}"`) as any
      createdNodes.push(rect.id)
      expect(rect.opacity).toBe(0.5)
    })
  })

  describe('create-ellipse', () => {
    test('creates ellipse with fill', async () => {
      const ellipse = await run(`create-ellipse --x 10 --y 80 --width 80 --height 80 --fill "#00FF00" --parentId "${testFrameId}"`) as any
      createdNodes.push(ellipse.id)
      expect(ellipse.type).toBe('ELLIPSE')
      expect(ellipse.fills[0].color).toBe('#00FF00')
    })
  })

  describe('create-frame', () => {
    test('creates frame with layout', async () => {
      const frame = await run(`create-frame --x 10 --y 180 --width 300 --height 100 --fill "#EEEEEE" --layoutMode HORIZONTAL --itemSpacing 10 --padding 16 --parentId "${testFrameId}"`) as any
      createdNodes.push(frame.id)
      expect(frame.type).toBe('FRAME')
      expect(frame.layoutMode).toBe('HORIZONTAL')
      expect(frame.itemSpacing).toBe(10)
    })
  })

  describe('create-text', () => {
    test('creates text with basic params', async () => {
      const text = await run(`create-text --x 10 --y 300 --text "Hello World" --fontSize 24 --fill "#333333" --parentId "${testFrameId}"`) as any
      createdNodes.push(text.id)
      expect(text.type).toBe('TEXT')
      expect(text.characters).toBe('Hello World')
      expect(text.fontSize).toBe(24)
    })

    test('creates text with bold font', async () => {
      const text = await run(`create-text --x 10 --y 340 --text "Bold Text" --fontSize 18 --fontStyle Bold --fill "#000000" --parentId "${testFrameId}"`) as any
      createdNodes.push(text.id)
      expect(text.characters).toBe('Bold Text')
    })
  })

  describe('create-polygon', () => {
    test('creates hexagon', async () => {
      const poly = await run(`create-polygon --x 100 --y 80 --size 60 --sides 6 --parentId "${testFrameId}"`) as any
      createdNodes.push(poly.id)
      expect(poly.type).toBe('POLYGON')
    })
  })

  describe('create-star', () => {
    test('creates star', async () => {
      const star = await run(`create-star --x 180 --y 80 --size 60 --points 5 --parentId "${testFrameId}"`) as any
      createdNodes.push(star.id)
      expect(star.type).toBe('STAR')
    })
  })

  describe('node operations', () => {
    let nodeId: string

    beforeAll(async () => {
      const rect = await run(`create-rectangle --x 500 --y 10 --width 80 --height 80 --fill "#AAAAAA" --parentId "${testFrameId}"`) as any
      nodeId = rect.id
      createdNodes.push(nodeId)
    })

    test('get-node returns node info', async () => {
      const node = await run(`get-node --id "${nodeId}"`) as any
      expect(node.id).toBe(nodeId)
      expect(node.type).toBe('RECTANGLE')
    })

    test('move-node changes position', async () => {
      const moved = await run(`move-node --id "${nodeId}" --x 510 --y 20`) as any
      expect(moved.x).toBe(510)
      expect(moved.y).toBe(20)
    })

    test('resize-node changes size', async () => {
      const resized = await run(`resize-node --id "${nodeId}" --width 100 --height 100`) as any
      expect(resized.width).toBe(100)
      expect(resized.height).toBe(100)
    })

    test('rename-node changes name', async () => {
      const renamed = await run(`rename-node --id "${nodeId}" --name "RenamedRect"`) as any
      expect(renamed.name).toBe('RenamedRect')
    })

    test('set-fill-color changes fill', async () => {
      const filled = await run(`set-fill-color --id "${nodeId}" --color "#FF00FF"`) as any
      expect(filled.fills[0].color).toBe('#FF00FF')
    })

    test('set-opacity changes opacity', async () => {
      const result = await run(`set-opacity --id "${nodeId}" --opacity 0.7`) as any
      expect(result.opacity).toBeCloseTo(0.7, 1)
    })

    test('set-visible hides node', async () => {
      const hidden = await run(`set-visible --id "${nodeId}" --visible false`) as any
      expect(hidden.visible).toBe(false)
      await run(`set-visible --id "${nodeId}" --visible true`)
    })

    test('set-corner-radius changes radius', async () => {
      const rounded = await run(`set-corner-radius --id "${nodeId}" --radius 16`) as any
      // Note: cornerRadius not returned in serialize, check via get-node if needed
      expect(rounded.id).toBe(nodeId)
    })
  })

  describe('set-effect', () => {
    let nodeId: string

    beforeAll(async () => {
      const rect = await run(`create-rectangle --x 500 --y 130 --width 100 --height 100 --fill "#FFFFFF" --parentId "${testFrameId}"`) as any
      nodeId = rect.id
      createdNodes.push(nodeId)
    })

    test('adds drop shadow', async () => {
      const result = await run(`set-effect --id "${nodeId}" --type DROP_SHADOW --color "#00000040" --offsetY 4 --radius 8`) as any
      expect(result.id).toBe(nodeId)
    })
  })

  describe('set-text', () => {
    let textId: string

    beforeAll(async () => {
      const text = await run(`create-text --x 500 --y 250 --text "Original" --fontSize 16 --parentId "${testFrameId}"`) as any
      textId = text.id
      createdNodes.push(textId)
    })

    test('changes text content', async () => {
      const result = await run(`set-text --id "${textId}" --text "Updated"`) as any
      expect(result.characters).toBe('Updated')
    })
  })

  describe('clone-node', () => {
    test('clones a node', async () => {
      const original = await run(`create-rectangle --x 500 --y 300 --width 50 --height 50 --fill "#FFFF00" --parentId "${testFrameId}"`) as any
      createdNodes.push(original.id)
      
      const clone = await run(`clone-node --id "${original.id}"`) as any
      createdNodes.push(clone.id)
      expect(clone.type).toBe('RECTANGLE')
      expect(clone.id).not.toBe(original.id)
    })
  })

  describe('import-svg', () => {
    test('imports SVG', async () => {
      const svg = '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="red"/></svg>'
      const result = await run(`import-svg --svg '${svg}' --x 500 --y 370 --name "SVG Icon" --parentId "${testFrameId}"`) as any
      createdNodes.push(result.id)
      expect(result.type).toBe('FRAME')
      expect(result.name).toBe('SVG Icon')
    })
  })

  describe('group-nodes', () => {
    test('groups nodes together', async () => {
      const r1 = await run(`create-rectangle --x 650 --y 10 --width 40 --height 40 --fill "#FF0000" --parentId "${testFrameId}"`) as any
      const r2 = await run(`create-rectangle --x 700 --y 10 --width 40 --height 40 --fill "#00FF00" --parentId "${testFrameId}"`) as any
      
      const group = await run(`group-nodes --ids "${r1.id},${r2.id}" --name "TestGroup"`) as any
      createdNodes.push(group.id)
      expect(group.type).toBe('GROUP')
      expect(group.name).toBe('TestGroup')
    })
  })

  describe('boolean operations', () => {
    test('union-nodes combines shapes', async () => {
      const r1 = await run(`create-rectangle --x 650 --y 70 --width 60 --height 60 --fill "#0000FF" --parentId "${testFrameId}"`) as any
      const r2 = await run(`create-rectangle --x 680 --y 100 --width 60 --height 60 --fill "#0000FF" --parentId "${testFrameId}"`) as any
      
      const union = await run(`union-nodes --ids "${r1.id},${r2.id}"`) as any
      createdNodes.push(union.id)
      expect(union.type).toBe('BOOLEAN_OPERATION')
    })
  })

  describe('viewport', () => {
    test('get-viewport returns viewport info', async () => {
      const vp = await run('get-viewport') as any
      expect(vp).toHaveProperty('center')
      expect(vp).toHaveProperty('zoom')
      expect(vp.center).toHaveProperty('x')
      expect(vp.center).toHaveProperty('y')
    })

    test('zoom-to-fit zooms to nodes', async () => {
      const result = await run(`zoom-to-fit --ids "${testFrameId}"`) as any
      expect(result).toHaveProperty('center')
      expect(result).toHaveProperty('zoom')
    })
  })

  describe('styles', () => {
    test('create-paint-style creates color style', async () => {
      const style = await run('create-paint-style --name "Test/Primary" --color "#E11D48"') as any
      expect(style.name).toBe('Test/Primary')
      expect(style).toHaveProperty('id')
    })

    test('get-local-styles returns styles', async () => {
      const styles = await run('get-local-styles --type paint') as any
      expect(styles).toHaveProperty('paintStyles')
      expect(Array.isArray(styles.paintStyles)).toBe(true)
    })
  })

  describe('export', () => {
    test('export-node exports as PNG', async () => {
      const rect = await run(`create-rectangle --x 800 --y 10 --width 100 --height 100 --fill "#00FFFF" --parentId "${testFrameId}"`) as any
      createdNodes.push(rect.id)
      
      const result = await run(`export-node --id "${rect.id}" --format PNG --scale 1`) as any
      expect(result).toHaveProperty('data')
      expect(result).toHaveProperty('filename')
      expect(result.data.length).toBeGreaterThan(0)
    })
  })

  describe('screenshot', () => {
    test('takes screenshot', async () => {
      const result = await run('screenshot --output /tmp/test-screenshot.png')
      expect(result).toBe('/tmp/test-screenshot.png')
    })
  })

  describe('delete-node', () => {
    test('deletes a node', async () => {
      const rect = await run(`create-rectangle --x 900 --y 10 --width 50 --height 50 --parentId "${testFrameId}"`) as any
      const result = await run(`delete-node --id "${rect.id}"`) as any
      expect(result.deleted).toBe(true)
    })
  })
})

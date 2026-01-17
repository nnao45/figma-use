/**
 * Integration tests for multiplayer WebSocket node creation
 * 
 * Creates nodes via WebSocket and verifies them via plugin API
 */
import { describe, test, expect, beforeAll, afterAll } from 'bun:test'
import {
  FigmaMultiplayerClient,
  getCookiesFromDevTools,
  parseFileKey,
  initCodec,
  createNodeChange,
  type NodeChange,
} from '../src/multiplayer/index.ts'
import { run } from './helpers.ts'

const FILE_URL = process.env.FIGMA_TEST_FILE || 'https://www.figma.com/design/s9XqYcmFHMlfqtHNTqxE58'
const PAGE_SESSION_ID = 5291
const PAGE_LOCAL_ID = 112873

let client: FigmaMultiplayerClient | null = null
let sessionID = 0
let createdNodeIds: string[] = []

async function createAndVerify(nodeChange: NodeChange): Promise<any> {
  if (!client) throw new Error('Client not connected')
  
  // Send and wait for server ACK - guarantees sync
  await client.sendNodeChangesSync([nodeChange])
  
  const nodeId = `${nodeChange.guid.sessionID}:${nodeChange.guid.localID}`
  createdNodeIds.push(nodeId)
  
  // Verify via plugin
  return await run(`node get ${nodeId} --json`)
}

describe('multiplayer integration', () => {
  beforeAll(async () => {
    try {
      await initCodec()
      const cookies = await getCookiesFromDevTools()
      const fileKey = parseFileKey(FILE_URL)
      
      client = new FigmaMultiplayerClient(fileKey, { connectionTimeout: 15000 })
      const session = await client.connect(cookies)
      sessionID = session.sessionID
    } catch (e) {
      console.warn('Skipping multiplayer tests - Chrome DevTools not available')
      client = null
    }
  }, 20000)

  afterAll(async () => {
    // Cleanup created nodes
    for (const id of createdNodeIds) {
      try {
        await run(`node delete ${id}`)
      } catch {}
    }
    
    client?.close()
  })

  test('creates rectangle via WebSocket', async () => {
    if (!client) return
    
    const localID = client.nextLocalID()
    const node = await createAndVerify(createNodeChange({
      sessionID,
      localID,
      parentSessionID: PAGE_SESSION_ID,
      parentLocalID: PAGE_LOCAL_ID,
      type: 'RECTANGLE',
      name: 'WS-TEST-RECT-' + Date.now(),
      x: 5000,
      y: 100,
      width: 200,
      height: 150,
      fill: '#FF5733',
      cornerRadius: 8,
    }))
    
    expect(node).not.toBeNull()
    expect(node.type).toBe('RECTANGLE')
    expect(node.width).toBe(200)
    expect(node.height).toBe(150)
    expect(node.cornerRadius).toBe(8)
  }, 10000)

  test('creates frame via WebSocket', async () => {
    if (!client) return
    
    const localID = client.nextLocalID()
    const node = await createAndVerify(createNodeChange({
      sessionID,
      localID,
      parentSessionID: PAGE_SESSION_ID,
      parentLocalID: PAGE_LOCAL_ID,
      type: 'FRAME',
      name: 'WS-TEST-FRAME-' + Date.now(),
      x: 5300,
      y: 100,
      width: 400,
      height: 300,
      fill: '#FFFFFF',
    }))
    
    expect(node).not.toBeNull()
    expect(node.type).toBe('FRAME')
    expect(node.width).toBe(400)
    expect(node.height).toBe(300)
  }, 10000)

  test('creates ellipse via WebSocket', async () => {
    if (!client) return
    
    const localID = client.nextLocalID()
    const node = await createAndVerify(createNodeChange({
      sessionID,
      localID,
      parentSessionID: PAGE_SESSION_ID,
      parentLocalID: PAGE_LOCAL_ID,
      type: 'ELLIPSE',
      name: 'WS-TEST-ELLIPSE-' + Date.now(),
      x: 5000,
      y: 300,
      width: 100,
      height: 100,
      fill: '#3498DB',
    }))
    
    expect(node).not.toBeNull()
    expect(node.type).toBe('ELLIPSE')
    expect(node.width).toBe(100)
    expect(node.height).toBe(100)
  }, 10000)

  test('creates node with stroke', async () => {
    if (!client) return
    
    const localID = client.nextLocalID()
    const node = await createAndVerify(createNodeChange({
      sessionID,
      localID,
      parentSessionID: PAGE_SESSION_ID,
      parentLocalID: PAGE_LOCAL_ID,
      type: 'RECTANGLE',
      name: 'WS-TEST-STROKE-' + Date.now(),
      x: 5150,
      y: 300,
      width: 100,
      height: 100,
      stroke: '#E74C3C',
      strokeWeight: 4,
    }))
    
    expect(node).not.toBeNull()
    expect(node.strokeWeight).toBe(4)
  }, 10000)

  test('creates node with opacity', async () => {
    if (!client) return
    
    const localID = client.nextLocalID()
    const node = await createAndVerify(createNodeChange({
      sessionID,
      localID,
      parentSessionID: PAGE_SESSION_ID,
      parentLocalID: PAGE_LOCAL_ID,
      type: 'RECTANGLE',
      name: 'WS-TEST-OPACITY-' + Date.now(),
      x: 5300,
      y: 300,
      width: 80,
      height: 80,
      fill: '#9B59B6',
      opacity: 0.5,
    }))
    
    expect(node).not.toBeNull()
    expect(node.opacity).toBeCloseTo(0.5, 1)
  }, 10000)

  test('batch creates multiple nodes', async () => {
    if (!client) return
    
    const nodeChanges: NodeChange[] = []
    const localIDs: number[] = []
    
    for (let i = 0; i < 10; i++) {
      const localID = client.nextLocalID()
      localIDs.push(localID)
      
      nodeChanges.push(createNodeChange({
        sessionID,
        localID,
        parentSessionID: PAGE_SESSION_ID,
        parentLocalID: PAGE_LOCAL_ID,
        type: 'RECTANGLE',
        name: `WS-BATCH-${i}`,
        x: 5000 + i * 35,
        y: 450,
        width: 30,
        height: 30,
        fill: { r: i / 10, g: 0.5, b: 1 - i / 10, a: 1 },
      }))
    }
    
    // Send and wait for ACK
    await client.sendNodeChangesSync(nodeChanges)
    
    // Track for cleanup
    for (const localID of localIDs) {
      createdNodeIds.push(`${sessionID}:${localID}`)
    }
    
    // Verify all nodes exist
    let found = 0
    for (const localID of localIDs) {
      try {
        const node = await run(`node get ${sessionID}:${localID} --json`) as any
        if (node && node.type === 'RECTANGLE') found++
      } catch {}
    }
    
    expect(found).toBe(10)
  }, 20000)

  test('creates star via WebSocket', async () => {
    if (!client) return
    
    const localID = client.nextLocalID()
    const node = await createAndVerify(createNodeChange({
      sessionID,
      localID,
      parentSessionID: PAGE_SESSION_ID,
      parentLocalID: PAGE_LOCAL_ID,
      type: 'STAR',
      name: 'WS-TEST-STAR-' + Date.now(),
      x: 5400,
      y: 300,
      width: 80,
      height: 80,
      fill: '#F1C40F',
    }))
    
    expect(node).not.toBeNull()
    expect(node.type).toBe('STAR')
  }, 10000)

  test('creates polygon via WebSocket', async () => {
    if (!client) return
    
    const localID = client.nextLocalID()
    const node = await createAndVerify(createNodeChange({
      sessionID,
      localID,
      parentSessionID: PAGE_SESSION_ID,
      parentLocalID: PAGE_LOCAL_ID,
      type: 'REGULAR_POLYGON',
      name: 'WS-TEST-POLYGON-' + Date.now(),
      x: 5500,
      y: 300,
      width: 80,
      height: 80,
      fill: '#1ABC9C',
    }))
    
    expect(node).not.toBeNull()
    expect(node.type).toBe('POLYGON')
  }, 10000)

  test('creates line via WebSocket', async () => {
    if (!client) return
    
    const localID = client.nextLocalID()
    const node = await createAndVerify(createNodeChange({
      sessionID,
      localID,
      parentSessionID: PAGE_SESSION_ID,
      parentLocalID: PAGE_LOCAL_ID,
      type: 'LINE',
      name: 'WS-TEST-LINE-' + Date.now(),
      x: 5000,
      y: 520,
      width: 200,
      height: 0,
      stroke: '#2C3E50',
      strokeWeight: 2,
    }))
    
    expect(node).not.toBeNull()
    expect(node.type).toBe('LINE')
  }, 10000)
})

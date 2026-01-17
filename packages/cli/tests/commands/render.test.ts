/**
 * Render tests using shared WebSocket connection
 */
import { describe, test, expect, beforeAll, afterAll } from 'bun:test'
import * as React from 'react'
import { run } from '../helpers.ts'
import { renderToNodeChanges } from '../../src/render/index.ts'
import { 
  FigmaMultiplayerClient, 
  getCookiesFromDevTools, 
  initCodec 
} from '../../src/multiplayer/index.ts'
import { getFileKey, getParentGUID } from '../../src/client.ts'

// Import test component
import Card from '../fixtures/Card.figma.tsx'

let client: FigmaMultiplayerClient | null = null
let sessionID = 0
let parentGUID = { sessionID: 0, localID: 0 }
let localIDCounter = 1

async function renderAndVerify(props: Record<string, unknown>): Promise<Array<{ id: string; name: string }>> {
  if (!client) throw new Error('Client not connected')
  
  const element = React.createElement(Card, props as any)
  const result = renderToNodeChanges(element, {
    sessionID,
    parentGUID,
    startLocalID: localIDCounter,
  })
  localIDCounter = result.nextLocalID
  
  await client.sendNodeChangesSync(result.nodeChanges)
  
  return result.nodeChanges.map(nc => ({
    id: `${nc.guid.sessionID}:${nc.guid.localID}`,
    name: nc.name || '',
  }))
}

describe('render', () => {
  beforeAll(async () => {
    await initCodec()
    const fileKey = await getFileKey()
    parentGUID = await getParentGUID()
    
    const cookies = await getCookiesFromDevTools()
    client = new FigmaMultiplayerClient(fileKey)
    const session = await client.connect(cookies)
    sessionID = session.sessionID
    localIDCounter = Date.now() % 1000000
  }, 20000)

  afterAll(() => {
    client?.close()
  })

  test('renders simple TSX component', async () => {
    const result = await renderAndVerify({ title: 'Test', items: ['A'] })
    
    expect(Array.isArray(result)).toBe(true)
    expect(result.length).toBeGreaterThan(0)
    expect(result[0].name).toBe('Card')
  })

  test('renders with multiple items', async () => {
    const result = await renderAndVerify({ title: 'Products', items: ['iPhone', 'MacBook', 'AirPods'] })
    // Card + Title + Items frame + 3 item frames + 3 dots + 3 texts + Actions + 2 buttons + 2 button texts = 17
    expect(result.length).toBe(17)
  })

  test('renders into parent node', async () => {
    // Create parent via plugin
    const parent = await run('create frame --x 0 --y 0 --width 500 --height 500 --name "Container" --json') as { id: string }
    const [pSession, pLocal] = parent.id.split(':').map(Number)
    
    // Render into parent
    const element = React.createElement(Card, { title: 'Nested', items: ['X'] })
    const result = renderToNodeChanges(element, {
      sessionID,
      parentGUID: { sessionID: pSession, localID: pLocal },
      startLocalID: localIDCounter++,
    })
    localIDCounter = result.nextLocalID
    
    await client!.sendNodeChangesSync(result.nodeChanges)
    
    const cardId = `${result.nodeChanges[0].guid.sessionID}:${result.nodeChanges[0].guid.localID}`
    const cardInfo = await run(`node get ${cardId} --json`) as { parentId?: string }
    expect(cardInfo.parentId).toBe(parent.id)
  })

  test('applies layout props correctly', async () => {
    const result = await renderAndVerify({ title: 'Layout', items: ['A'] })
    
    const card = await run(`node get ${result[0].id} --json`) as { layoutMode?: string; itemSpacing?: number }
    expect(card.layoutMode).toBe('VERTICAL')
    expect(card.itemSpacing).toBe(16)
  })

  test('applies padding correctly', async () => {
    const result = await renderAndVerify({ title: 'Padding', items: ['A'] })
    
    const card = await run(`node get ${result[0].id} --json`) as { padding?: { top: number; left: number } }
    expect(card.padding?.top).toBe(24)
    expect(card.padding?.left).toBe(24)
  })

  test('applies fill colors', async () => {
    const result = await renderAndVerify({ title: 'Colors', items: ['A'] })
    
    const card = await run(`node get ${result[0].id} --json`) as { fills?: Array<{ color: string }> }
    expect(card.fills?.[0]?.color).toBe('#FFFFFF')
  })

  test('applies corner radius', async () => {
    const result = await renderAndVerify({ title: 'Radius', items: ['A'] })
    
    const card = await run(`node get ${result[0].id} --json`) as { cornerRadius?: number }
    expect(card.cornerRadius).toBe(12)
  })

  test('creates text nodes with content', async () => {
    const result = await renderAndVerify({ title: 'Hello World', items: ['A'] })
    
    const titleNode = result.find(n => n.name === 'Title')
    expect(titleNode).toBeDefined()
    
    const titleInfo = await run(`node get ${titleNode!.id} --json`) as { characters?: string }
    expect(titleInfo.characters).toBe('Hello World')
  })

  test('handles variant prop', async () => {
    const primaryResult = await renderAndVerify({ title: 'Primary', items: ['A'] })
    const primaryButton = primaryResult.find(n => n.name === 'Primary Button')
    const primaryInfo = await run(`node get ${primaryButton!.id} --json`) as { fills?: Array<{ color: string }> }
    expect(primaryInfo.fills?.[0]?.color).toBe('#3B82F6')
    
    const secondaryResult = await renderAndVerify({ title: 'Secondary', items: ['A'], variant: 'secondary' })
    const secondaryButton = secondaryResult.find(n => n.name === 'Primary Button')
    const secondaryInfo = await run(`node get ${secondaryButton!.id} --json`) as { fills?: Array<{ color: string }> }
    expect(secondaryInfo.fills?.[0]?.color).toBe('#6B7280')
  })
})

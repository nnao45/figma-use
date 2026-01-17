import { defineCommand } from 'citty'
import { handleError, getFileKey, getParentGUID } from '../client.ts'
import { ok, fail } from '../format.ts'
import { resolve } from 'path'
import { existsSync } from 'fs'
import * as React from 'react'
import { renderToNodeChanges } from '../render/index.ts'
import { FigmaMultiplayerClient, getCookiesFromDevTools } from '../multiplayer/index.ts'

export default defineCommand({
  meta: { description: 'Render React component to Figma via WebSocket' },
  args: {
    file: { type: 'positional', description: 'TSX/JSX file path', required: true },
    props: { type: 'string', description: 'JSON props to pass to component' },
    parent: { type: 'string', description: 'Parent node ID (sessionID:localID)' },
    export: { type: 'string', description: 'Named export (default: default)' },
    json: { type: 'boolean', description: 'Output as JSON' },
    dryRun: { type: 'boolean', description: 'Output NodeChanges without sending to Figma' },
  },
  async run({ args }) {
    const filePath = resolve(args.file)
    
    if (!existsSync(filePath)) {
      console.error(fail(`File not found: ${filePath}`))
      process.exit(1)
    }
    
    try {
      // Import TSX file directly - Bun handles transpilation
      const module = await import(filePath)
      
      const exportName = args.export || 'default'
      const Component = module[exportName]
      
      if (!Component) {
        console.error(fail(`Export "${exportName}" not found in ${filePath}`))
        process.exit(1)
      }
      
      // Get connection info
      const fileKey = await getFileKey()
      const parentGUID = args.parent 
        ? parseGUID(args.parent)
        : await getParentGUID()
      
      // Connect to Figma
      const cookies = await getCookiesFromDevTools()
      const client = new FigmaMultiplayerClient(fileKey)
      const session = await client.connect(cookies)
      
      // Create React element and render to NodeChanges
      const props = args.props ? JSON.parse(args.props) : {}
      const element = React.createElement(Component, props)
      
      const result = renderToNodeChanges(element, {
        sessionID: session.sessionID,
        parentGUID,
        startLocalID: Date.now() % 1000000,
      })
      
      if (!args.json) {
        console.log(`Rendering ${result.nodeChanges.length} nodes...`)
      }
      
      // Send to Figma
      await client.sendNodeChangesSync(result.nodeChanges)
      client.close()
      
      // Output
      if (args.json) {
        const ids = result.nodeChanges.map(nc => ({
          id: `${nc.guid.sessionID}:${nc.guid.localID}`,
          name: nc.name,
        }))
        console.log(JSON.stringify(ids, null, 2))
      } else {
        console.log(ok(`Rendered ${result.nodeChanges.length} nodes`))
        const first = result.nodeChanges[0]
        if (first) {
          console.log(`  root: ${first.guid.sessionID}:${first.guid.localID}`)
        }
      }
      
    } catch (e) { handleError(e) }
  }
})

function parseGUID(id: string): { sessionID: number; localID: number } {
  const parts = id.split(':').map(Number)
  return { sessionID: parts[0] ?? 0, localID: parts[1] ?? 0 }
}

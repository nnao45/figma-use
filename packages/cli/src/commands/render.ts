import { defineCommand } from 'citty'
import { consola } from 'consola'
import { handleError, sendCommand } from '../client.ts'
import { ok, fail } from '../format.ts'
import { resolve } from 'path'
import { existsSync, writeFileSync, unlinkSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import * as React from 'react'
import { renderToBatchCommands } from '../render/batch-reconciler.ts'
import {
  loadVariablesIntoRegistry,
  isRegistryLoaded,
  preloadIcons,
  collectIcons,
  transformJsxSnippet
} from '../render/index.ts'

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = []
  for await (const chunk of process.stdin) {
    chunks.push(chunk)
  }
  return Buffer.concat(chunks).toString('utf-8')
}

function findNodeModulesDir(): string | null {
  let dir = import.meta.dir
  for (let i = 0; i < 10; i++) {
    if (existsSync(join(dir, 'node_modules', 'react'))) {
      return dir
    }
    const parent = resolve(dir, '..')
    if (parent === dir) break
    dir = parent
  }
  return null
}

const HELP = `
Render JSX to Figma.

EXAMPLES

  # From stdin (pure JSX only, no variables/logic)
  echo '<Frame style={{p: 24, bg: "#3B82F6", rounded: 12}}>
    <Text style={{size: 18, color: "#FFF"}}>Hello</Text>
  </Frame>' | figma-use render --stdin --x 100 --y 100

  # From file (supports components, variants, logic)
  figma-use render ./Card.figma.tsx
  figma-use render ./Card.figma.tsx --x 100 --y 200
  figma-use render ./Card.figma.tsx --props '{"title": "Hello"}'

ELEMENTS

  Frame, Rectangle, Ellipse, Text, Line, Star, Polygon, Vector, Group, Icon

STYLE SHORTHANDS

  w, h          width, height
  bg            backgroundColor
  rounded       borderRadius
  p, px, py     padding, paddingLeft+Right, paddingTop+Bottom
  pt, pr, pb, pl  individual padding sides
  flex          flexDirection ("row" | "col")
  justify       justifyContent ("start" | "center" | "end" | "between")
  items         alignItems ("start" | "center" | "end" | "stretch")
  size          fontSize
  weight        fontWeight
  font          fontFamily

SETUP

  Start Figma with: open -a Figma --args --remote-debugging-port=9222
`

export default defineCommand({
  meta: {
    description: 'Render JSX to Figma. Use --examples for API reference.'
  },
  args: {
    examples: { type: 'boolean', description: 'Show examples and API reference' },
    file: { type: 'positional', description: 'TSX/JSX file path', required: false },
    stdin: { type: 'boolean', description: 'Read TSX from stdin' },
    props: { type: 'string', description: 'JSON props to pass to component' },
    parent: { type: 'string', description: 'Parent node ID' },
    x: { type: 'string', description: 'X position of rendered root' },
    y: { type: 'string', description: 'Y position of rendered root' },
    export: { type: 'string', description: 'Named export (default: default)' },
    json: { type: 'boolean', description: 'Output as JSON' },
    'dry-run': { type: 'boolean', description: 'Output commands without sending to Figma' }
  },
  async run({ args }) {
    if (args.examples) {
      console.log(HELP)
      return
    }

    let filePath: string
    let tempFile: string | null = null

    // Handle stdin or file
    if (args.stdin) {
      let code = await readStdin()
      if (!code.trim()) {
        console.error(fail('No input received from stdin'))
        process.exit(1)
      }

      // Transform JSX snippet to factory function
      code = transformJsxSnippet(code)

      // Write temp file
      const baseDir = findNodeModulesDir() || tmpdir()
      tempFile = join(baseDir, `.figma-render-${Date.now()}.js`)
      writeFileSync(tempFile, code)
      filePath = tempFile
    } else if (args.file) {
      filePath = resolve(args.file)

      if (!existsSync(filePath)) {
        console.error(fail(`File not found: ${filePath}`))
        process.exit(1)
      }
    } else {
      console.error(fail('Provide a file path or use --stdin'))
      process.exit(1)
    }

    try {
      // Import TSX file directly - Bun handles transpilation
      const module = await import(filePath)

      const exportName = args.export || 'default'
      let Component = module[exportName]

      // If it's a factory (from stdin wrapper), call it with React and helpers
      if (
        typeof Component === 'function' &&
        (Component.length === 1 || Component.length === 2) &&
        args.stdin
      ) {
        const { defineVars } = await import('../render/vars.ts')
        Component = Component(React, { defineVars })
      }

      if (!Component) {
        console.error(fail(`Export "${exportName}" not found`))
        process.exit(1)
      }

      // Load Figma variables for name resolution (if not already loaded)
      if (!isRegistryLoaded()) {
        try {
          const variables = await sendCommand<Array<{ id: string; name: string }>>(
            'get-variables',
            { simple: true }
          )
          loadVariablesIntoRegistry(variables)
        } catch {
          // Variables not available - name-based lookup will fail, ID-based still works
        }
      }

      // Create React element
      const props = args.props ? JSON.parse(args.props) : {}
      const element = React.createElement(Component, props)

      // Collect and preload icons from the element tree
      const icons = collectIcons(element)
      if (icons.length > 0) {
        if (!args.json) {
          console.log(`Preloading ${icons.length} icon(s)...`)
        }
        await preloadIcons(icons)
      }

      // Render to batch commands
      const result = renderToBatchCommands(element, {
        parentId: args.parent,
        x: args.x ? Number(args.x) : undefined,
        y: args.y ? Number(args.y) : undefined
      })

      if (args['dry-run']) {
        console.log(JSON.stringify(result.commands, null, 2))
        return
      }

      if (!args.json) {
        console.log(`Rendering ${result.commands.length} nodes...`)
      }

      // Send batch to Figma via CDP/RPC
      const batchResult = await sendCommand<Array<{ id: string; name: string }>>('batch', {
        commands: result.commands
      })

      // Output
      if (args.json) {
        console.log(JSON.stringify(batchResult, null, 2))
      } else {
        console.log(ok(`Rendered ${batchResult.length} nodes`))
        if (batchResult[0]) {
          console.log(`  root: ${batchResult[0].id}`)
        }
      }
    } catch (e) {
      handleError(e)
    } finally {
      // Cleanup temp file
      if (tempFile && existsSync(tempFile)) {
        unlinkSync(tempFile)
      }
    }
  }
})

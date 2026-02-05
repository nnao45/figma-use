import { defineCommand } from 'citty'

import { sendCommand, handleError } from '../../client.ts'
import { fail, ok, dim, bold } from '../../format.ts'
import { loadIconSvg } from '../../render/icon.ts'
import { pMap } from './api.ts'
import { replaceSvgCurrentColor } from './svg-color.ts'

const VAR_PREFIX_RE = /^(?:var:|[$])(.+)$/

// Concurrency for Iconify API fetches (icon SVG loading)
const FETCH_CONCURRENCY = 5
// Concurrency for Figma commands (sequential to avoid overloading)
const FIGMA_CONCURRENCY = 1

interface ImportedIcon {
  name: string
  id: string
}

export default defineCommand({
  meta: { description: 'Import multiple icons from Iconify into Figma' },
  args: {
    names: {
      type: 'positional',
      description: 'Icon names separated by commas (e.g., lucide:arrow-right,lucide:home,mdi:star)',
      required: true
    },
    size: { type: 'string', description: 'Size in pixels', default: '24' },
    color: { type: 'string', description: 'Icon color (hex or var:Name)' },
    parent: { type: 'string', description: 'Parent node ID' },
    component: { type: 'boolean', description: 'Create as Figma components' },
    grid: { type: 'boolean', description: 'Arrange icons in a grid layout' },
    gap: { type: 'string', description: 'Gap between icons in grid mode', default: '16' },
    cols: { type: 'string', description: 'Columns in grid mode', default: '8' },
    json: { type: 'boolean', description: 'Output as JSON' }
  },
  async run({ args }) {
    try {
      const names = args.names
        .split(',')
        .map((n: string) => n.trim())
        .filter(Boolean)

      if (names.length === 0) {
        console.error(fail('No icon names provided'))
        process.exit(1)
      }

      const size = Number(args.size)
      const gap = Number(args.gap)
      const cols = Number(args.cols)
      const varMatch = args.color?.match(VAR_PREFIX_RE)
      const hexColor = varMatch ? '#000000' : args.color || '#000000'

      console.log(bold(`Importing ${names.length} icons...`))

      // Phase 1: Fetch all icon SVGs concurrently (with concurrency limit)
      console.log(dim(`  Fetching icon data...`))
      const iconDataList = await pMap(
        names,
        async (name) => {
          try {
            return await loadIconSvg(name, size)
          } catch {
            return null
          }
        },
        FETCH_CONCURRENCY
      )

      // Create a parent frame if grid mode
      let parentId = args.parent
      if (args.grid) {
        const frameResult = (await sendCommand('create-frame', {
          x: 0,
          y: 0,
          width: cols * (size + gap) - gap,
          height: Math.ceil(names.length / cols) * (size + gap) - gap,
          name: 'Icons',
          parentId: args.parent
        })) as { id: string }
        parentId = frameResult.id

        await sendCommand('set-auto-layout', {
          id: parentId,
          direction: 'HORIZONTAL',
          gap,
          wrap: true,
          padding: 0
        })
      }

      // Phase 2: Import into Figma sequentially (Figma plugin can't handle parallel mutations)
      const results: ImportedIcon[] = []
      const errors: string[] = []

      for (let i = 0; i < names.length; i++) {
        const name = names[i]
        const iconData = iconDataList[i]

        if (!iconData) {
          errors.push(name)
          console.log(dim(`  [${i + 1}/${names.length}] ${name} — not found`))
          continue
        }

        try {
          const svg = await replaceSvgCurrentColor(iconData.svg, hexColor)

          let x = 0
          let y = 0
          if (!args.grid && !parentId) {
            const col = i % cols
            const row = Math.floor(i / cols)
            x = col * (size + gap)
            y = row * (size + gap)
          }

          const result = (await sendCommand('import-svg', {
            svg,
            x,
            y,
            parentId
          })) as { id: string }

          const iconName = name.replace(':', '/')
          await sendCommand('rename-node', { id: result.id, name: iconName })

          if (varMatch) {
            await sendCommand('bind-fill-variable-by-name', {
              id: result.id,
              variableName: varMatch[1],
              recursive: true
            })
          }

          let finalId = result.id
          if (args.component) {
            const componentResult = (await sendCommand('convert-to-component', {
              id: result.id
            })) as { id: string }
            finalId = componentResult.id
          }

          results.push({ name, id: finalId })
          console.log(ok(`  [${i + 1}/${names.length}] ${name}`) + dim(` → ${finalId}`))
        } catch (err) {
          errors.push(name)
          console.log(
            dim(
              `  [${i + 1}/${names.length}] ${name} — ${err instanceof Error ? err.message : 'failed'}`
            )
          )
        }
      }

      console.log()
      console.log(bold(`Imported: ${results.length}/${names.length}`))
      if (errors.length > 0) {
        console.log(fail(`Failed: ${errors.join(', ')}`))
      }

      if (args.json) {
        console.log(
          JSON.stringify(
            {
              imported: results,
              errors,
              parentId: args.grid ? parentId : undefined
            },
            null,
            2
          )
        )
      }
    } catch (e) {
      handleError(e)
    }
  }
})

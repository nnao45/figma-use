import { defineCommand } from 'citty'
import { sendCommand, printResult, handleError } from '../../client.ts'
import { loadIconSvg } from '../../render/icon.ts'
import { fail } from '../../format.ts'
import { parseColorArg } from '../../color-arg.ts'

export default defineCommand({
  meta: { description: 'Create an icon from Iconify' },
  args: {
    name: { type: 'positional', description: 'Icon name (e.g., mdi:home, lucide:star)', required: true },
    x: { type: 'string', description: 'X coordinate', default: '0' },
    y: { type: 'string', description: 'Y coordinate', default: '0' },
    size: { type: 'string', description: 'Size in pixels', default: '24' },
    color: { type: 'string', description: 'Icon color (hex or var:Name)' },
    parent: { type: 'string', description: 'Parent node ID' },
    component: { type: 'boolean', description: 'Create as Figma component' },
    json: { type: 'boolean', description: 'Output as JSON' }
  },
  async run({ args }) {
    try {
      const size = Number(args.size)
      const iconData = await loadIconSvg(args.name, size)
      
      if (!iconData) {
        console.error(fail(`Icon "${args.name}" not found`))
        process.exit(1)
      }

      const colorArg = parseColorArg(args.color)
      
      // Replace currentColor with hex (variable binding happens after import)
      let svg = iconData.svg
      svg = svg.replace(/currentColor/g, colorArg?.hex || '#000000')

      // Import SVG
      const result = await sendCommand('import-svg', {
        svg,
        x: Number(args.x),
        y: Number(args.y),
        parentId: args.parent
      }) as { id: string }

      // Rename to icon name
      const iconName = args.name.replace(':', '/')
      await sendCommand('rename-node', { id: result.id, name: iconName })

      // Bind variable to icon fills if specified
      if (colorArg?.variable) {
        await sendCommand('bind-fill-variable-by-name', {
          id: result.id,
          variableName: colorArg.variable,
          recursive: true
        })
      }

      // Convert to component if requested
      let finalId = result.id
      if (args.component) {
        const componentResult = await sendCommand('convert-to-component', { 
          id: result.id 
        }) as { id: string }
        finalId = componentResult.id
      }

      // Get final result
      const finalResult = await sendCommand('get-node-info', { id: finalId })
      printResult(finalResult, args.json, 'create')
    } catch (e) {
      handleError(e)
    }
  }
})

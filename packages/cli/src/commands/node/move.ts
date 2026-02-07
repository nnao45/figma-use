import { defineCommand } from 'citty'

import { sendCommand, printResult, handleError } from '../../client.ts'

export default defineCommand({
  meta: { description: 'Move a node (absolute with --x/--y, or relative with --dx/--dy)' },
  args: {
    id: { type: 'positional', description: 'Node ID', required: true },
    x: { type: 'string', description: 'Absolute X position' },
    y: { type: 'string', description: 'Absolute Y position' },
    dx: { type: 'string', description: 'Relative X offset' },
    dy: { type: 'string', description: 'Relative Y offset' },
    json: { type: 'boolean', description: 'Output as JSON' }
  },
  async run({ args }) {
    try {
      const hasAbsolute = args.x !== undefined || args.y !== undefined
      const hasRelative = args.dx !== undefined || args.dy !== undefined

      if (!hasAbsolute && !hasRelative) {
        console.error('Provide --x/--y for absolute or --dx/--dy for relative movement')
        process.exit(1)
      }
      if (hasAbsolute && hasRelative) {
        console.error('Cannot mix absolute (--x/--y) and relative (--dx/--dy) positioning')
        process.exit(1)
      }

      const payload: Record<string, unknown> = { id: args.id }
      if (hasRelative) {
        payload.dx = args.dx !== undefined ? Number(args.dx) : 0
        payload.dy = args.dy !== undefined ? Number(args.dy) : 0
      } else {
        if (args.x !== undefined) payload.x = Number(args.x)
        if (args.y !== undefined) payload.y = Number(args.y)
      }

      const result = await sendCommand('move-node', payload)
      printResult(result, args.json)
    } catch (e) {
      handleError(e)
    }
  }
})

import { defineCommand } from 'citty'
import { sendCommand, printResult, handleError } from '../client.ts'

export default defineCommand({
  meta: { description: 'Set layout properties of a child in auto-layout' },
  args: {
    id: { type: 'string', description: 'Node ID', required: true },
    horizontalSizing: { type: 'string', description: 'Horizontal sizing: FIXED, FILL, HUG' },
    verticalSizing: { type: 'string', description: 'Vertical sizing: FIXED, FILL, HUG' },
    positioning: { type: 'string', description: 'Positioning: AUTO, ABSOLUTE' },
    x: { type: 'string', description: 'X position (for absolute)' },
    y: { type: 'string', description: 'Y position (for absolute)' }
  },
  async run({ args }) {
    try {
      printResult(await sendCommand('set-layout-child', {
        id: args.id,
        horizontalSizing: args.horizontalSizing,
        verticalSizing: args.verticalSizing,
        positioning: args.positioning,
        x: args.x ? Number(args.x) : undefined,
        y: args.y ? Number(args.y) : undefined
      }))
    } catch (e) { handleError(e) }
  }
})

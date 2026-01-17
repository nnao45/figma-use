import { defineCommand } from 'citty'
import { sendCommand, printResult, handleError } from '../client.ts'

export default defineCommand({
  meta: { description: 'Set min/max width and height constraints' },
  args: {
    id: { type: 'string', description: 'Node ID', required: true },
    minWidth: { type: 'string', description: 'Minimum width' },
    maxWidth: { type: 'string', description: 'Maximum width' },
    minHeight: { type: 'string', description: 'Minimum height' },
    maxHeight: { type: 'string', description: 'Maximum height' }
  },
  async run({ args }) {
    try {
      printResult(await sendCommand('set-min-max', {
        id: args.id,
        minWidth: args.minWidth ? Number(args.minWidth) : undefined,
        maxWidth: args.maxWidth ? Number(args.maxWidth) : undefined,
        minHeight: args.minHeight ? Number(args.minHeight) : undefined,
        maxHeight: args.maxHeight ? Number(args.maxHeight) : undefined
      }))
    } catch (e) { handleError(e) }
  }
})

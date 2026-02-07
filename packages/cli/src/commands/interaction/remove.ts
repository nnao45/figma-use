import { defineCommand } from 'citty'

import { sendCommand, handleError } from '../../client.ts'
import { printResult } from '../../output.ts'

export default defineCommand({
  meta: { description: 'Remove interactions from a node' },
  args: {
    id: { type: 'positional', description: 'Node ID', required: true },
    index: { type: 'string', description: 'Interaction index (0-based)' },
    all: { type: 'boolean', description: 'Remove all interactions' },
    json: { type: 'boolean', description: 'Output as JSON' }
  },
  async run({ args }) {
    try {
      if (!args.all && args.index === undefined) {
        throw new Error('Specify --index or --all')
      }
      if (args.all && args.index !== undefined) {
        throw new Error('Use either --index or --all, not both')
      }

      const index = args.index !== undefined ? Number(args.index) : undefined
      if (args.index !== undefined && Number.isNaN(index)) {
        throw new Error(`Invalid --index: ${args.index}`)
      }

      const result = await sendCommand('remove-interaction', {
        nodeId: args.id,
        index,
        all: args.all
      })

      if (args.json) {
        printResult(result, true)
        return
      }

      if (args.all) {
        console.log('Removed all interactions')
      } else {
        console.log(`Removed interaction #${index}`)
      }
    } catch (e) {
      handleError(e)
    }
  }
})

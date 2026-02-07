import { defineCommand } from 'citty'

import { sendCommand, printResult, handleError } from '../../client.ts'

export default defineCommand({
  meta: { description: 'Flip a node horizontally or vertically' },
  args: {
    id: { type: 'positional', description: 'Node ID', required: true },
    axis: { type: 'string', description: 'Axis to flip (x or y)', required: true },
    json: { type: 'boolean', description: 'Output as JSON' }
  },
  async run({ args }) {
    try {
      if (args.axis !== 'x' && args.axis !== 'y') {
        console.error('Axis must be "x" or "y"')
        process.exit(1)
      }
      const result = await sendCommand('flip-node', {
        id: args.id,
        axis: args.axis
      })
      printResult(result, args.json)
    } catch (e) {
      handleError(e)
    }
  }
})

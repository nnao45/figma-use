import { defineCommand } from 'citty'

import { sendCommand, printResult, handleError } from '../../client.ts'

export default defineCommand({
  meta: { description: 'Scale a node by a factor (e.g., 1.5 for 150%)' },
  args: {
    id: { type: 'positional', description: 'Node ID', required: true },
    factor: { type: 'string', description: 'Scale factor (e.g., 1.5 for 150%)', required: true },
    json: { type: 'boolean', description: 'Output as JSON' }
  },
  async run({ args }) {
    try {
      const result = await sendCommand('scale-node', {
        id: args.id,
        factor: Number(args.factor)
      })
      printResult(result, args.json)
    } catch (e) {
      handleError(e)
    }
  }
})

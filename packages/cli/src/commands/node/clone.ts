import { defineCommand } from 'citty'
import { sendCommand, printResult, handleError } from '../../client.ts'

export default defineCommand({
  meta: { description: 'Clone a node' },
  args: {
    id: { type: 'positional', description: 'Node ID to clone', required: true },
    json: { type: 'boolean', description: 'Output as JSON' }
  },
  async run({ args }) {
    try {
      const result = await sendCommand('clone-node', { id: args.id })
      printResult(result, args.json)
    } catch (e) { handleError(e) }
  }
})

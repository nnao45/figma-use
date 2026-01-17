import { defineCommand } from 'citty'
import { sendCommand, printResult, handleError } from '../../client.ts'

export default defineCommand({
  meta: { description: 'Get all components' },
  args: {
    json: { type: 'boolean', description: 'Output as JSON' }
  },
  async run({ args }) {
    try {
      const result = await sendCommand('get-all-components')
      printResult(result, args.json)
    } catch (e) { handleError(e) }
  }
})

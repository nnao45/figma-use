import { defineCommand } from 'citty'
import { sendCommand, printResult, handleError } from '../client.ts'

export default defineCommand({
  meta: { description: 'Find nodes by name or type' },
  args: {
    name: { type: 'string', description: 'Node name to search' },
    type: { type: 'string', description: 'Node type: FRAME, TEXT, RECTANGLE, ELLIPSE, etc' },
    json: { type: 'boolean', description: 'Output as JSON' }
  },
  async run({ args }) {
    try {
      const result = await sendCommand('find-by-name', { 
        name: args.name,
        type: args.type
      })
      printResult(result, args.json)
    } catch (e) { handleError(e) }
  }
})

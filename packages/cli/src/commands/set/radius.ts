import { defineCommand } from 'citty'
import { sendCommand, printResult, handleError } from '../../client.ts'

export default defineCommand({
  meta: { description: 'Set corner radius' },
  args: {
    id: { type: 'positional', description: 'Node ID', required: true },
    radius: { type: 'string', description: 'Uniform radius' },
    topLeft: { type: 'string', description: 'Top left radius' },
    topRight: { type: 'string', description: 'Top right radius' },
    bottomLeft: { type: 'string', description: 'Bottom left radius' },
    bottomRight: { type: 'string', description: 'Bottom right radius' },
    json: { type: 'boolean', description: 'Output as JSON' }
  },
  async run({ args }) {
    try {
      const result = await sendCommand('set-corner-radius', { 
        id: args.id, 
        cornerRadius: args.radius ? Number(args.radius) : 0,
        topLeftRadius: args.topLeft ? Number(args.topLeft) : undefined,
        topRightRadius: args.topRight ? Number(args.topRight) : undefined,
        bottomLeftRadius: args.bottomLeft ? Number(args.bottomLeft) : undefined,
        bottomRightRadius: args.bottomRight ? Number(args.bottomRight) : undefined
      })
      printResult(result, args.json)
    } catch (e) { handleError(e) }
  }
})

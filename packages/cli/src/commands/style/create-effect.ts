import { defineCommand } from 'citty'
import { sendCommand, printResult, handleError } from '../../client.ts'

export default defineCommand({
  meta: { description: 'Create an effect style' },
  args: {
    name: { type: 'positional', description: 'Style name', required: true },
    type: { type: 'string', description: 'Effect type: DROP_SHADOW, INNER_SHADOW, LAYER_BLUR, BACKGROUND_BLUR', required: true },
    radius: { type: 'string', description: 'Blur radius' },
    offsetX: { type: 'string', description: 'Shadow offset X' },
    offsetY: { type: 'string', description: 'Shadow offset Y' },
    color: { type: 'string', description: 'Shadow color (hex with alpha)' },
    json: { type: 'boolean', description: 'Output as JSON' }
  },
  async run({ args }) {
    try {
      const result = await sendCommand('create-effect-style', { 
        name: args.name, 
        type: args.type,
        radius: args.radius ? Number(args.radius) : undefined,
        offsetX: args.offsetX ? Number(args.offsetX) : undefined,
        offsetY: args.offsetY ? Number(args.offsetY) : undefined,
        color: args.color
      })
      printResult(result, args.json)
    } catch (e) { handleError(e) }
  }
})

import { defineCommand } from 'citty'
import { sendCommand, printResult, handleError } from '../client.ts'

export default defineCommand({
  meta: { description: 'Set rotation of a node' },
  args: {
    id: { type: 'string', description: 'Node ID', required: true },
    angle: { type: 'string', description: 'Rotation angle in degrees', required: true }
  },
  async run({ args }) {
    try {
      printResult(await sendCommand('set-rotation', {
        id: args.id,
        angle: Number(args.angle)
      }))
    } catch (e) { handleError(e) }
  }
})

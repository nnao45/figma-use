import { defineCommand } from 'citty'
import { sendCommand, printResult, handleError } from '../client.ts'

export default defineCommand({
  meta: { description: 'Set stroke alignment' },
  args: {
    id: { type: 'string', description: 'Node ID', required: true },
    align: { type: 'string', description: 'Alignment: INSIDE, OUTSIDE, CENTER', required: true }
  },
  async run({ args }) {
    try {
      printResult(await sendCommand('set-stroke-align', {
        id: args.id,
        align: args.align
      }))
    } catch (e) { handleError(e) }
  }
})

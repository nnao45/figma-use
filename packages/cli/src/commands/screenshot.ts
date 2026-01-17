import { defineCommand } from 'citty'
import { sendCommand, handleError } from '../client.ts'
import { writeFileSync } from 'fs'

export default defineCommand({
  meta: { description: 'Take a screenshot of current viewport' },
  args: {
    output: { type: 'string', description: 'Output file path', default: '/tmp/figma-screenshot.png' },
    scale: { type: 'string', description: 'Export scale', default: '1' }
  },
  async run({ args }) {
    try {
      const result = await sendCommand('screenshot', {
        scale: Number(args.scale)
      }) as { data: string }
      
      const buffer = Buffer.from(result.data, 'base64')
      writeFileSync(args.output, buffer)
      console.log(args.output)
    } catch (e) { handleError(e) }
  }
})

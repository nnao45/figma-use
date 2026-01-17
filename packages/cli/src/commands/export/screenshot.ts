import { defineCommand } from 'citty'
import { sendCommand, handleError } from '../../client.ts'
import { writeFileSync } from 'fs'

export default defineCommand({
  meta: { description: 'Screenshot current viewport' },
  args: {
    output: { type: 'string', description: 'Output file path', default: '/tmp/figma-screenshot.png' },
    scale: { type: 'string', description: 'Export scale', default: '1' },
    timeout: { type: 'string', description: 'Timeout in seconds' }
  },
  async run({ args }) {
    try {
      const result = await sendCommand('screenshot', {
        scale: Number(args.scale)
      }, { timeout: args.timeout ? Number(args.timeout) * 1000 : undefined }) as { data: string }
      
      const buffer = Buffer.from(result.data, 'base64')
      writeFileSync(args.output, buffer)
      console.log(args.output)
    } catch (e) { handleError(e) }
  }
})

import { defineCommand } from 'citty'
import { sendCommand, handleError } from '../client.ts'
import { writeFileSync } from 'fs'

export default defineCommand({
  meta: { description: 'Export current selection as image' },
  args: {
    output: { type: 'string', description: 'Output file path', default: '/tmp/figma-selection.png' },
    format: { type: 'string', description: 'Format: PNG, JPG, SVG, PDF', default: 'PNG' },
    scale: { type: 'string', description: 'Export scale', default: '2' },
    padding: { type: 'string', description: 'Padding around selection', default: '0' }
  },
  async run({ args }) {
    try {
      const result = await sendCommand('export-selection', {
        format: args.format.toUpperCase(),
        scale: Number(args.scale),
        padding: Number(args.padding)
      }) as { data: string }
      
      const buffer = Buffer.from(result.data, 'base64')
      writeFileSync(args.output, buffer)
      console.log(args.output)
    } catch (e) { handleError(e) }
  }
})

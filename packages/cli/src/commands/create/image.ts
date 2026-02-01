import { defineCommand } from 'citty'
import { existsSync, readFileSync } from 'fs'

import { sendCommand, printResult, handleError } from '../../client.ts'
import { fail } from '../../format.ts'

export default defineCommand({
  meta: { description: 'Create an image node from URL or file' },
  args: {
    src: {
      type: 'positional',
      description: 'Image source: URL (https://...) or local file path',
      required: true
    },
    x: { type: 'string', description: 'X coordinate', default: '0' },
    y: { type: 'string', description: 'Y coordinate', default: '0' },
    width: { type: 'string', description: 'Width (default: image native width)' },
    height: { type: 'string', description: 'Height (default: image native height)' },
    name: { type: 'string', description: 'Node name' },
    parent: { type: 'string', description: 'Parent node ID' },
    scale: {
      type: 'string',
      description: 'Scale mode: fill, fit, crop, tile',
      default: 'fill'
    },
    radius: { type: 'string', description: 'Corner radius' },
    opacity: { type: 'string', description: 'Opacity (0-1)' },
    json: { type: 'boolean', description: 'Output as JSON' }
  },
  async run({ args }) {
    try {
      let url: string | undefined
      let data: string | undefined

      if (args.src.startsWith('http://') || args.src.startsWith('https://')) {
        url = args.src
      } else if (args.src.startsWith('data:')) {
        // data URI: extract base64 portion
        const base64Start = args.src.indexOf(',')
        if (base64Start === -1) {
          console.error(fail('Invalid data URI'))
          process.exit(1)
        }
        data = args.src.slice(base64Start + 1)
      } else {
        // Local file path
        if (!existsSync(args.src)) {
          console.error(fail(`File not found: ${args.src}`))
          process.exit(1)
        }
        const buffer = readFileSync(args.src)
        data = buffer.toString('base64')
      }

      const result = await sendCommand('create-image-node', {
        x: Number(args.x),
        y: Number(args.y),
        width: args.width ? Number(args.width) : undefined,
        height: args.height ? Number(args.height) : undefined,
        name: args.name,
        parentId: args.parent,
        url,
        data,
        scaleMode: args.scale?.toUpperCase(),
        radius: args.radius ? Number(args.radius) : undefined,
        opacity: args.opacity ? Number(args.opacity) : undefined
      })
      printResult(result, args.json, 'create')
    } catch (e) {
      handleError(e)
    }
  }
})

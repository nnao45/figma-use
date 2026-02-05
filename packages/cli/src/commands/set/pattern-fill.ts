import { defineCommand } from 'citty'

import { sendCommand, printResult, handleError } from '../../client.ts'

export default defineCommand({
  meta: {
    description: 'Set pattern/image fill with tiling options'
  },
  args: {
    id: { type: 'positional', description: 'Node ID', required: true },
    url: { type: 'positional', description: 'Image URL for pattern', required: true },
    mode: {
      type: 'string',
      description: 'Scale mode: tile, fill, fit, crop (default: tile)'
    },
    scale: {
      type: 'string',
      description: 'Tile scale factor (tile mode only, default: 1)'
    },
    rotation: {
      type: 'string',
      description: 'Pattern rotation in degrees (default: 0)'
    },
    json: { type: 'boolean', description: 'Output as JSON' }
  },
  async run({ args }) {
    try {
      const scaleMode = parseScaleMode(args.mode as string | undefined)
      const scale = args.scale ? parseFloat(args.scale) : 1
      const rotation = args.rotation ? parseFloat(args.rotation) : 0

      // Validate URL format
      const url = args.url as string
      if (!isValidUrl(url)) {
        throw new Error(`Invalid URL: "${url}". Must be a valid http/https URL or data URI`)
      }

      // Validate scale
      if (isNaN(scale) || scale <= 0) {
        throw new Error('Scale must be a positive number')
      }

      // Validate rotation
      if (isNaN(rotation)) {
        throw new Error('Rotation must be a valid number')
      }

      const result = await sendCommand('set-pattern-fill', {
        id: args.id,
        url: args.url,
        scaleMode,
        scale,
        rotation
      })
      printResult(result, args.json)
    } catch (e) {
      handleError(e)
    }
  }
})

function isValidUrl(url: string): boolean {
  // Accept http/https URLs and data URIs
  return /^(https?:\/\/|data:)/.test(url)
}

function parseScaleMode(mode?: string): 'TILE' | 'FILL' | 'FIT' | 'CROP' {
  if (!mode) return 'TILE'
  const modeMap: Record<string, 'TILE' | 'FILL' | 'FIT' | 'CROP'> = {
    tile: 'TILE',
    fill: 'FILL',
    fit: 'FIT',
    crop: 'CROP'
  }
  const normalized = mode.toLowerCase()
  const result = modeMap[normalized]
  if (!result) {
    throw new Error(`Invalid scale mode: ${mode}. Use: tile, fill, fit, or crop`)
  }
  return result
}

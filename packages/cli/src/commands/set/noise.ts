import { defineCommand } from 'citty'

import { sendCommand, printResult, handleError } from '../../client.ts'

export default defineCommand({
  meta: {
    description: 'Add noise texture overlay to a node'
  },
  args: {
    id: { type: 'positional', description: 'Node ID', required: true },
    opacity: {
      type: 'string',
      description: 'Noise opacity (0-1, default: 0.1)'
    },
    size: {
      type: 'string',
      description: 'Noise grain size: fine, medium, coarse (default: medium)'
    },
    blend: {
      type: 'string',
      description: 'Blend mode: overlay, multiply, soft-light, etc. (default: overlay)'
    },
    json: { type: 'boolean', description: 'Output as JSON' }
  },
  async run({ args }) {
    try {
      const opacity = args.opacity ? parseFloat(args.opacity) : 0.1
      const size = parseNoiseSize(args.size as string | undefined)
      const blendMode = parseBlendMode(args.blend as string | undefined)

      if (opacity < 0 || opacity > 1) {
        throw new Error('Opacity must be between 0 and 1')
      }

      const result = await sendCommand('set-noise', {
        id: args.id,
        opacity,
        size,
        blendMode
      })
      printResult(result, args.json)
    } catch (e) {
      handleError(e)
    }
  }
})

function parseNoiseSize(size?: string): 'fine' | 'medium' | 'coarse' {
  if (!size) return 'medium'
  const normalized = size.toLowerCase()
  if (!['fine', 'medium', 'coarse'].includes(normalized)) {
    throw new Error(`Invalid noise size: ${size}. Use: fine, medium, or coarse`)
  }
  return normalized as 'fine' | 'medium' | 'coarse'
}

function parseBlendMode(blend?: string): string {
  if (!blend) return 'OVERLAY'
  const blendMap: Record<string, string> = {
    normal: 'NORMAL',
    multiply: 'MULTIPLY',
    screen: 'SCREEN',
    overlay: 'OVERLAY',
    darken: 'DARKEN',
    lighten: 'LIGHTEN',
    'color-dodge': 'COLOR_DODGE',
    'color-burn': 'COLOR_BURN',
    'hard-light': 'HARD_LIGHT',
    'soft-light': 'SOFT_LIGHT',
    difference: 'DIFFERENCE',
    exclusion: 'EXCLUSION',
    hue: 'HUE',
    saturation: 'SATURATION',
    color: 'COLOR',
    luminosity: 'LUMINOSITY'
  }
  const normalized = blend.toLowerCase()
  const result = blendMap[normalized]
  if (!result) {
    throw new Error(`Invalid blend mode: ${blend}`)
  }
  return result
}

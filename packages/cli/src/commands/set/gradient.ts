import { defineCommand } from 'citty'

import { sendCommand, printResult, handleError } from '../../client.ts'

export default defineCommand({
  meta: {
    description: 'Set gradient fill (linear, radial, angular, diamond)'
  },
  args: {
    id: { type: 'positional', description: 'Node ID', required: true },
    type: {
      type: 'positional',
      description: 'Gradient type: linear, radial, angular, diamond',
      required: true
    },
    stops: {
      type: 'positional',
      description: 'Color stops: "#FF0000:0,#00FF00:0.5,#0000FF:1"',
      required: true
    },
    angle: {
      type: 'string',
      description: 'Angle in degrees (linear/angular only, default: 0)'
    },
    json: { type: 'boolean', description: 'Output as JSON' }
  },
  async run({ args }) {
    try {
      const gradientType = parseGradientType(args.type as string)
      const stops = parseGradientStops(args.stops as string)
      const angle = args.angle ? parseFloat(args.angle) : 0

      // Validate angle
      if (isNaN(angle)) {
        throw new Error('Angle must be a valid number')
      }

      const result = await sendCommand('set-gradient', {
        id: args.id,
        type: gradientType,
        stops,
        angle
      })
      printResult(result, args.json)
    } catch (e) {
      handleError(e)
    }
  }
})

function parseGradientType(
  type: string
): 'GRADIENT_LINEAR' | 'GRADIENT_RADIAL' | 'GRADIENT_ANGULAR' | 'GRADIENT_DIAMOND' {
  const typeMap: Record<
    string,
    'GRADIENT_LINEAR' | 'GRADIENT_RADIAL' | 'GRADIENT_ANGULAR' | 'GRADIENT_DIAMOND'
  > = {
    linear: 'GRADIENT_LINEAR',
    radial: 'GRADIENT_RADIAL',
    angular: 'GRADIENT_ANGULAR',
    diamond: 'GRADIENT_DIAMOND'
  }
  const normalized = type.toLowerCase()
  const result = typeMap[normalized]
  if (!result) {
    throw new Error(`Invalid gradient type: ${type}. Use: linear, radial, angular, or diamond`)
  }
  return result
}

function parseGradientStops(stopsStr: string): Array<{ color: string; position: number }> {
  // Format: "#FF0000:0,#00FF00:0.5,#0000FF:1"
  const stops = stopsStr.split(',').map((stop) => {
    const parts = stop.trim().split(':')
    const color = parts[0]
    const posStr = parts[1]
    if (!color || !posStr) {
      throw new Error(`Invalid stop format "${stop}". Expected "color:position"`)
    }
    const position = parseFloat(posStr)
    if (isNaN(position) || position < 0 || position > 1) {
      throw new Error(`Invalid position in stop "${stop}". Position must be between 0 and 1`)
    }
    if (!isValidHexColor(color)) {
      throw new Error(`Invalid color "${color}" in stop "${stop}". Must be hex format (#RGB, #RRGGBB, or #RRGGBBAA)`)
    }
    return { color, position }
  })

  if (stops.length < 2) {
    throw new Error('Gradient must have at least 2 color stops')
  }

  return stops
}

function isValidHexColor(color: string): boolean {
  // Validate hex color format: #RGB, #RRGGBB, or #RRGGBBAA
  return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/.test(color)
}

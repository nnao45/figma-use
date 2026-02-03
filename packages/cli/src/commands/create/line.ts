import { defineCommand } from 'citty'

import { sendCommand, printResult, handleError } from '../../client.ts'

export default defineCommand({
  meta: { description: 'Create a line' },
  args: {
    x: { type: 'string', description: 'X coordinate', required: true },
    y: { type: 'string', description: 'Y coordinate', required: true },
    length: { type: 'string', description: 'Length', required: true },
    name: { type: 'string', description: 'Name' },
    parent: { type: 'string', description: 'Parent node ID' },
    stroke: { type: 'string', description: 'Stroke color (hex or var:Name)' },
    'stroke-weight': { type: 'string', description: 'Stroke weight' },
    'start-cap': {
      type: 'string',
      description:
        'Start cap: none, round, square, arrow, arrow-lines, arrow-equilateral, triangle, diamond, circle'
    },
    'end-cap': {
      type: 'string',
      description:
        'End cap: none, round, square, arrow, arrow-lines, arrow-equilateral, triangle, diamond, circle'
    },
    json: { type: 'boolean', description: 'Output as JSON' }
  },
  async run({ args }) {
    try {
      const capValues = new Set([
        'none',
        'round',
        'square',
        'arrow',
        'arrow-lines',
        'arrow-equilateral',
        'triangle',
        'diamond',
        'circle'
      ])
      const capList = Array.from(capValues)
        .map((value) => `"${value}"`)
        .join(', ')
      const startCap = args['start-cap'] ? String(args['start-cap']).toLowerCase() : undefined
      const endCap = args['end-cap'] ? String(args['end-cap']).toLowerCase() : undefined
      if (startCap && !capValues.has(startCap)) {
        throw new Error(`Invalid --start-cap "${args['start-cap']}". Allowed: ${capList}`)
      }
      if (endCap && !capValues.has(endCap)) {
        throw new Error(`Invalid --end-cap "${args['end-cap']}". Allowed: ${capList}`)
      }

      const result = await sendCommand('create-line', {
        x: Number(args.x),
        y: Number(args.y),
        length: Number(args.length),
        name: args.name,
        parentId: args.parent,
        stroke: args.stroke,
        strokeWeight: args['stroke-weight'] ? Number(args['stroke-weight']) : undefined,
        startCap,
        endCap
      })
      printResult(result, args.json, 'create')
    } catch (e) {
      handleError(e)
    }
  }
})

import { defineCommand } from 'citty'
import { sendCommand, printResult, handleError } from '../../client.ts'

export default defineCommand({
  meta: { description: 'Create a star' },
  args: {
    x: { type: 'string', description: 'X coordinate', required: true },
    y: { type: 'string', description: 'Y coordinate', required: true },
    size: { type: 'string', description: 'Size (width/height)', required: true },
    points: { type: 'string', description: 'Number of points', default: '5' },
    innerRatio: { type: 'string', description: 'Inner radius ratio (0-1)', default: '0.5' },
    name: { type: 'string', description: 'Name' },
    parent: { type: 'string', description: 'Parent node ID' },
    fill: { type: 'string', description: 'Fill color (hex)' },
    stroke: { type: 'string', description: 'Stroke color (hex)' },
    strokeWeight: { type: 'string', description: 'Stroke weight' },
    json: { type: 'boolean', description: 'Output as JSON' }
  },
  async run({ args }) {
    try {
      const result = await sendCommand('create-star', {
        x: Number(args.x),
        y: Number(args.y),
        size: Number(args.size),
        points: Number(args.points),
        innerRadius: Number(args.innerRatio),
        name: args.name,
        parentId: args.parent,
        fill: args.fill,
        stroke: args.stroke,
        strokeWeight: args.strokeWeight ? Number(args.strokeWeight) : undefined
      })
      printResult(result, args.json, 'create')
    } catch (e) { handleError(e) }
  }
})

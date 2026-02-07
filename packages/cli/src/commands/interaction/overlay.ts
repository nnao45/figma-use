import { defineCommand } from 'citty'

import { sendCommand, handleError } from '../../client.ts'
import { printResult } from '../../output.ts'

function parseNumber(value?: string, name?: string): number | undefined {
  if (value === undefined) return undefined
  const num = Number(value)
  if (Number.isNaN(num)) throw new Error(`Invalid ${name || 'number'}: ${value}`)
  return num
}

export default defineCommand({
  meta: { description: 'Add a hover-to-overlay interaction' },
  args: {
    id: { type: 'positional', description: 'Source node ID', required: true },
    destination: { type: 'positional', description: 'Overlay node ID', required: true },
    trigger: { type: 'string', description: 'Trigger type', default: 'ON_HOVER' },
    transition: { type: 'string', description: 'Transition type', default: 'DISSOLVE' },
    direction: { type: 'string', description: 'Transition direction (LEFT, RIGHT, TOP, BOTTOM)' },
    duration: { type: 'string', description: 'Transition duration in ms', default: '300' },
    easing: {
      type: 'string',
      description: 'Transition easing (LINEAR, EASE_IN, EASE_OUT, EASE_IN_AND_OUT, GENTLE, QUICK, BOUNCY, SLOW)',
      default: 'EASE_IN_AND_OUT'
    },
    json: { type: 'boolean', description: 'Output as JSON' }
  },
  async run({ args }) {
    try {
      const durationMs = parseNumber(args.duration, '--duration')
      const reactions = await sendCommand('add-interaction', {
        nodeId: args.id,
        trigger: args.trigger,
        action: 'OVERLAY',
        destinationId: args.destination,
        transition: args.transition,
        direction: args.direction,
        durationMs,
        easing: args.easing
      })

      if (args.json) {
        printResult(reactions, true)
        return
      }

      const index = Array.isArray(reactions) ? Math.max(0, reactions.length - 1) : 0
      console.log(`Added interaction #${index}: ${args.trigger.toUpperCase()} → OVERLAY → ${args.destination}`)
    } catch (e) {
      handleError(e)
    }
  }
})

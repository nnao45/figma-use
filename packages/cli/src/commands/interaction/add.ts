import { defineCommand } from 'citty'

import { sendCommand, handleError } from '../../client.ts'
import { printResult } from '../../output.ts'

function parseNumber(value?: string, name?: string): number | undefined {
  if (value === undefined) return undefined
  const num = Number(value)
  if (Number.isNaN(num)) throw new Error(`Invalid ${name || 'number'}: ${value}`)
  return num
}

function formatActionSummary(action: string, destination?: string, url?: string): string {
  if (action === 'URL') return `URL → ${url}`
  if (action === 'BACK' || action === 'CLOSE') return action
  return `${action} → ${destination}`
}

export default defineCommand({
  meta: { description: 'Add an interaction to a node' },
  args: {
    id: { type: 'positional', description: 'Node ID', required: true },
    trigger: {
      type: 'string',
      description: 'Trigger type (ON_CLICK, ON_HOVER, ON_PRESS, ON_DRAG, MOUSE_ENTER, MOUSE_LEAVE, AFTER_TIMEOUT)',
      required: true
    },
    action: {
      type: 'string',
      description: 'Action type (NAVIGATE, OVERLAY, SWAP, SCROLL_TO, CHANGE_TO, BACK, CLOSE, URL)',
      required: true
    },
    destination: { type: 'string', description: 'Destination node ID (for NAVIGATE/OVERLAY/SWAP/SCROLL_TO/CHANGE_TO)' },
    url: { type: 'string', description: 'URL (for URL action)' },
    transition: { type: 'string', description: 'Transition type', default: 'DISSOLVE' },
    direction: { type: 'string', description: 'Transition direction (LEFT, RIGHT, TOP, BOTTOM)' },
    duration: { type: 'string', description: 'Transition duration in ms', default: '300' },
    easing: {
      type: 'string',
      description: 'Transition easing (LINEAR, EASE_IN, EASE_OUT, EASE_IN_AND_OUT, GENTLE, QUICK, BOUNCY, SLOW)',
      default: 'EASE_IN_AND_OUT'
    },
    timeout: { type: 'string', description: 'Timeout in ms (for AFTER_TIMEOUT)' },
    'preserve-scroll': { type: 'boolean', description: 'Preserve scroll position' },
    json: { type: 'boolean', description: 'Output as JSON' }
  },
  async run({ args }) {
    try {
      const durationMs = parseNumber(args.duration, '--duration')
      const timeoutMs = parseNumber(args.timeout, '--timeout')

      const reactions = (await sendCommand('add-interaction', {
        nodeId: args.id,
        trigger: args.trigger,
        action: args.action,
        destinationId: args.destination,
        url: args.url,
        transition: args.transition,
        direction: args.direction,
        durationMs,
        easing: args.easing,
        timeoutMs,
        preserveScrollPosition: args['preserve-scroll']
      })) as Array<Record<string, unknown>>

      if (args.json) {
        printResult(reactions, true)
        return
      }

      const index = Math.max(0, reactions.length - 1)
      const actionSummary = formatActionSummary(
        args.action.toUpperCase(),
        args.destination,
        args.url
      )
      console.log(`Added interaction #${index}: ${args.trigger.toUpperCase()} → ${actionSummary}`)
    } catch (e) {
      handleError(e)
    }
  }
})

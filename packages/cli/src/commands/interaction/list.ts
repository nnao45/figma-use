import { defineCommand } from 'citty'

import { sendCommand, handleError } from '../../client.ts'
import { printResult } from '../../output.ts'

type SerializedTransition = {
  type?: string
  direction?: string
  duration?: number
  easing?: { type?: string }
  matchLayers?: boolean
}

type SerializedAction = {
  type?: string
  navigation?: string
  destinationId?: string
  transition?: SerializedTransition
  url?: string
}

type SerializedReaction = {
  trigger?: { type?: string; timeout?: number; delay?: number }
  actions?: SerializedAction[]
}

function formatTransition(transition?: SerializedTransition): string | undefined {
  if (!transition || !transition.type) return undefined
  const parts = [transition.type]
  if (transition.direction) parts.push(transition.direction)
  if (typeof transition.duration === 'number') parts.push(`${transition.duration}ms`)
  if (transition.easing?.type) parts.push(transition.easing.type)
  return parts.join(' ')
}

function formatAction(action?: SerializedAction): string {
  if (!action) return 'UNKNOWN'
  if (action.type === 'URL') return `URL → ${action.url || ''}`.trim()
  if (action.type === 'BACK' || action.type === 'CLOSE') return action.type
  if (action.type === 'NODE') {
    const nav = action.navigation || 'NODE'
    const dest = action.destinationId ? ` → ${action.destinationId}` : ''
    return `${nav}${dest}`
  }
  return action.type || 'UNKNOWN'
}

export default defineCommand({
  meta: { description: 'List interactions on a node' },
  args: {
    id: { type: 'positional', description: 'Node ID', required: true },
    json: { type: 'boolean', description: 'Output as JSON' }
  },
  async run({ args }) {
    try {
      const result = (await sendCommand('list-interactions', {
        nodeId: args.id
      })) as SerializedReaction[]

      if (args.json) {
        printResult(result, true)
        return
      }

      if (result.length === 0) {
        console.log('(no interactions)')
        return
      }

      result.forEach((reaction, i) => {
        const trigger = reaction.trigger?.type || 'UNKNOWN'
        const triggerDetails: string[] = []
        if (typeof reaction.trigger?.timeout === 'number') {
          triggerDetails.push(`timeout ${reaction.trigger.timeout}ms`)
        }
        if (typeof reaction.trigger?.delay === 'number') {
          triggerDetails.push(`delay ${reaction.trigger.delay}ms`)
        }

        const action = reaction.actions?.[0]
        const actionText = formatAction(action)
        console.log(`[${i}] ${trigger} → ${actionText}`)
        if (triggerDetails.length > 0) {
          console.log(`    ${triggerDetails.join(', ')}`)
        }
        const transitionText = formatTransition(action?.transition)
        if (transitionText) {
          console.log(`    transition: ${transitionText}`)
        }
      })

      console.log(`\n${result.length} interaction(s)`)
    } catch (e) {
      handleError(e)
    }
  }
})

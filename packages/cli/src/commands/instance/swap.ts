import { defineCommand } from 'citty'

import { sendCommand, handleError } from '../../client.ts'
import { ok } from '../../format.ts'

export default defineCommand({
  meta: { description: 'Swap the component of an instance' },
  args: {
    id: { type: 'positional', description: 'Instance ID', required: true },
    component: { type: 'string', description: 'Target component ID to swap to', required: true },
    json: { type: 'boolean', description: 'Output as JSON' }
  },
  async run({ args }) {
    try {
      const result = await sendCommand<{ id: string; name: string; componentName: string }>(
        'eval',
        {
          code: `
          const node = await figma.getNodeByIdAsync(${JSON.stringify(args.id)})
          if (!node || node.type !== 'INSTANCE') {
            throw new Error('Node is not an instance: ' + ${JSON.stringify(args.id)})
          }
          const comp = await figma.getNodeByIdAsync(${JSON.stringify(args.component)})
          if (!comp || comp.type !== 'COMPONENT') {
            throw new Error('Target is not a component: ' + ${JSON.stringify(args.component)})
          }
          node.swapComponent(comp)
          return { id: node.id, name: node.name, componentName: comp.name }
        `
        }
      )

      if (args.json) {
        console.log(JSON.stringify(result, null, 2))
      } else {
        console.log(ok(`Swapped "${result.name}" to component "${result.componentName}" (${result.id})`))
      }
    } catch (error) {
      handleError(error)
    }
  }
})

import { defineCommand } from 'citty'

import { sendCommand, printResult, handleError } from '../../client.ts'

export default defineCommand({
  meta: { description: 'Get the main component of an instance' },
  args: {
    id: { type: 'positional', description: 'Instance ID', required: true },
    json: { type: 'boolean', description: 'Output as JSON' }
  },
  async run({ args }) {
    try {
      const result = await sendCommand<{
        id: string
        name: string
        type: string
        remote: boolean
        description: string
        componentSetName?: string
      }>('eval', {
        code: `
          const node = await figma.getNodeByIdAsync(${JSON.stringify(args.id)})
          if (!node || node.type !== 'INSTANCE') {
            throw new Error('Node is not an instance: ' + ${JSON.stringify(args.id)})
          }
          const main = await node.getMainComponentAsync()
          if (!main) {
            throw new Error('Main component not found')
          }
          const result = {
            id: main.id,
            name: main.name,
            type: main.type,
            remote: main.remote,
            description: main.description
          }
          if (main.parent && main.parent.type === 'COMPONENT_SET') {
            result.componentSetName = main.parent.name
          }
          return result
        `
      })

      if (args.json) {
        console.log(JSON.stringify(result, null, 2))
      } else {
        printResult(result)
      }
    } catch (error) {
      handleError(error)
    }
  }
})

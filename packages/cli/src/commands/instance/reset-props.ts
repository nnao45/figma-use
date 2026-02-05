import { defineCommand } from 'citty'

import { sendCommand, handleError } from '../../client.ts'
import { ok } from '../../format.ts'

export default defineCommand({
  meta: { description: 'Reset all overridden properties of an instance' },
  args: {
    ids: { type: 'positional', description: 'Instance IDs to reset', required: true },
    json: { type: 'boolean', description: 'Output as JSON' }
  },
  async run({ args }) {
    try {
      const ids = args.ids.split(/[\s,]+/).filter(Boolean)

      const result = await sendCommand<Array<{ id: string; name: string }>>('eval', {
        code: `
          const ids = ${JSON.stringify(ids)}
          const result = []
          for (const id of ids) {
            const node = await figma.getNodeByIdAsync(id)
            if (node && node.type === 'INSTANCE') {
              node.resetAllComponentProperties()
              result.push({ id: node.id, name: node.name })
            }
          }
          return result
        `
      })

      if (args.json) {
        console.log(JSON.stringify(result, null, 2))
      } else {
        for (const node of result) {
          console.log(ok(`Reset properties of "${node.name}" (${node.id})`))
        }
      }
    } catch (error) {
      handleError(error)
    }
  }
})

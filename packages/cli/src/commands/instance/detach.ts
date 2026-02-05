import { defineCommand } from 'citty'

import { sendCommand, handleError } from '../../client.ts'
import { ok } from '../../format.ts'

export default defineCommand({
  meta: { description: 'Detach instance(s) from their component' },
  args: {
    ids: { type: 'positional', description: 'Instance IDs to detach', required: true },
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
              const frame = node.detachInstance()
              result.push({ id: frame.id, name: frame.name })
            }
          }
          return result
        `
      })

      if (args.json) {
        console.log(JSON.stringify(result, null, 2))
      } else {
        for (const node of result) {
          console.log(ok(`Detached "${node.name}" (${node.id})`))
        }
      }
    } catch (error) {
      handleError(error)
    }
  }
})

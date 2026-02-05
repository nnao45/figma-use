import { defineCommand } from 'citty'

import { sendCommand, printResult, handleError } from '../../client.ts'

export default defineCommand({
  meta: { description: 'List all instances of a component' },
  args: {
    id: { type: 'positional', description: 'Component ID', required: true },
    page: { type: 'string', description: 'Limit search to a specific page ID' },
    limit: { type: 'string', description: 'Max results', default: '100' },
    json: { type: 'boolean', description: 'Output as JSON' }
  },
  async run({ args }) {
    try {
      const result = await sendCommand<Array<{ id: string; name: string; type: string }>>('eval', {
        code: `
          const comp = await figma.getNodeByIdAsync(${JSON.stringify(args.id)})
          if (!comp || (comp.type !== 'COMPONENT' && comp.type !== 'COMPONENT_SET')) {
            throw new Error('Node is not a component: ' + ${JSON.stringify(args.id)})
          }

          const limit = ${Number(args.limit)}
          const pageId = ${args.page ? JSON.stringify(args.page) : 'null'}
          const results = []

          function walk(node) {
            if (results.length >= limit) return
            if (node.type === 'INSTANCE') {
              const main = node.mainComponent
              if (main && (main.id === comp.id || (main.parent && main.parent.type === 'COMPONENT_SET' && main.parent.id === comp.id))) {
                results.push({ id: node.id, name: node.name, type: node.type })
              }
            }
            if ('children' in node) {
              for (const child of node.children) {
                if (results.length >= limit) return
                walk(child)
              }
            }
          }

          if (pageId) {
            const page = await figma.getNodeByIdAsync(pageId)
            if (page) walk(page)
          } else {
            for (const page of figma.root.children) {
              if (results.length >= limit) break
              walk(page)
            }
          }

          return results
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

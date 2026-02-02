import { defineCommand } from 'citty'

import { handleError } from '../../client.ts'
import { dim, bold } from '../../format.ts'
import { listCollections, getCollection } from './api.ts'

export default defineCommand({
  meta: { description: 'List available icon sets or icons in a set' },
  args: {
    prefix: {
      type: 'positional',
      description: 'Icon set prefix to show icons (e.g., lucide, mdi)',
      required: false
    },
    category: {
      type: 'string',
      description: 'Filter by category when listing icons in a set'
    },
    json: { type: 'boolean', description: 'Output as JSON' }
  },
  async run({ args }) {
    try {
      if (args.prefix) {
        const data = await getCollection(args.prefix)

        if (args.json) {
          console.log(JSON.stringify(data, null, 2))
          return
        }

        console.log(bold(`${data.title}`) + dim(` (${args.prefix}) — ${data.total} icons`))
        console.log()

        if (data.categories) {
          for (const [cat, names] of Object.entries(data.categories)) {
            if (args.category && cat.toLowerCase() !== args.category.toLowerCase()) continue
            console.log(bold(cat) + dim(` (${names.length})`))
            console.log(`  ${names.map((n) => `${args.prefix}:${n}`).join('  ')}`)
            console.log()
          }
        }

        if (data.uncategorized && data.uncategorized.length > 0 && !args.category) {
          console.log(bold('Uncategorized') + dim(` (${data.uncategorized.length})`))
          console.log(`  ${data.uncategorized.map((n) => `${args.prefix}:${n}`).join('  ')}`)
          console.log()
        }

        console.log(dim(`Use: figma-use icon import ${args.prefix}:<name> to add to Figma`))
        return
      }

      // List all collections
      const data = await listCollections()

      if (args.json) {
        console.log(JSON.stringify(data, null, 2))
        return
      }

      // Popular sets first
      const popular = ['lucide', 'mdi', 'tabler', 'heroicons', 'ph', 'ri', 'carbon', 'bi', 'ion']
      const entries = Object.entries(data).sort((a, b) => {
        const ai = popular.indexOf(a[0])
        const bi = popular.indexOf(b[0])
        if (ai !== -1 && bi !== -1) return ai - bi
        if (ai !== -1) return -1
        if (bi !== -1) return 1
        return b[1].total - a[1].total
      })

      console.log(bold(`${entries.length} icon sets available`))
      console.log()

      for (const [prefix, info] of entries) {
        const author = info.author?.name ? dim(` by ${info.author.name}`) : ''
        const samples = info.samples ? dim(` — ${info.samples.join(', ')}`) : ''
        console.log(`  ${bold(prefix.padEnd(24))} ${String(info.total).padStart(6)} icons  ${info.name}${author}${samples}`)
      }

      console.log()
      console.log(dim(`Use: figma-use icon sets <prefix> to browse icons in a set`))
      console.log(dim(`Use: figma-use icon search <query> to search across all sets`))
    } catch (e) {
      handleError(e)
    }
  }
})

import { defineCommand } from 'citty'

import { handleError } from '../../client.ts'
import { dim, bold } from '../../format.ts'
import { searchIcons } from './api.ts'

export default defineCommand({
  meta: {
    description: 'Search icons from Iconify (600K+ icons from Lucide, Material Design, etc.)'
  },
  args: {
    query: {
      type: 'positional',
      description: 'Search query (e.g., "arrow", "home", "settings")',
      required: true
    },
    prefix: {
      type: 'string',
      description: 'Filter by icon set (e.g., lucide, mdi, tabler)'
    },
    limit: {
      type: 'string',
      description: 'Max results',
      default: '32'
    },
    json: { type: 'boolean', description: 'Output as JSON' }
  },
  async run({ args }) {
    try {
      const data = await searchIcons(args.query, {
        prefix: args.prefix,
        limit: Number(args.limit)
      })

      if (args.json) {
        console.log(JSON.stringify(data, null, 2))
        return
      }

      if (data.icons.length === 0) {
        console.log(`No icons found for "${args.query}"`)
        return
      }

      console.log(bold(`Found ${data.total} icons`) + dim(` (showing ${data.icons.length})`))
      console.log()

      // Group by collection
      const grouped = new Map<string, string[]>()
      for (const icon of data.icons) {
        const [prefix, ...rest] = icon.split(':')
        const name = rest.join(':')
        if (!grouped.has(prefix)) grouped.set(prefix, [])
        grouped.get(prefix)!.push(name)
      }

      for (const [prefix, names] of grouped) {
        const info = data.collections[prefix]
        const label = info ? `${info.name} (${prefix})` : prefix
        console.log(bold(label))
        for (const name of names) {
          console.log(`  ${prefix}:${name}`)
        }
        console.log()
      }

      console.log(dim(`Use: figma-use create icon <name> to add to Figma`))
      console.log(dim(`Use: figma-use icon import <names...> for batch import`))
    } catch (e) {
      handleError(e)
    }
  }
})

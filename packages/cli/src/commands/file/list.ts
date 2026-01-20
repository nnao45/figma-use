import { defineCommand } from 'citty'
import type { PluginConnection } from '../../client.ts'

const PROXY_URL = process.env.FIGMA_PROXY_URL || 'http://localhost:38451'

export default defineCommand({
  meta: { description: 'List connected files' },
  args: {
    json: { type: 'boolean', description: 'Output as JSON' }
  },
  async run({ args }) {
    const res = await fetch(`${PROXY_URL}/files`)
    const files = (await res.json()) as PluginConnection[]

    if (args.json) {
      console.log(JSON.stringify(files, null, 2))
      return
    }

    if (files.length === 0) {
      console.log('No files connected')
      return
    }

    for (const [i, f] of files.entries()) {
      const marker = f.active ? '→' : ' '
      console.log(`${marker} [${i}] ${f.fileName} (${f.sessionId})`)
    }
  }
})

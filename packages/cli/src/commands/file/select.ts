import { defineCommand } from 'citty'
import type { PluginConnection } from '../../client.ts'

const PROXY_URL = process.env.FIGMA_PROXY_URL || 'http://localhost:38451'

export default defineCommand({
  meta: { description: 'Select active file for commands' },
  args: {
    file: { type: 'positional', description: 'File key or name (partial match)', required: true }
  },
  async run({ args }) {
    // Get list of files
    const filesRes = await fetch(`${PROXY_URL}/files`)
    const files = (await filesRes.json()) as PluginConnection[]

    if (files.length === 0) {
      console.error('No files connected')
      process.exit(1)
    }

    // Find matching file
    const query = args.file.toLowerCase()
    const match = files.find(
      (f) => f.sessionId === args.file || 
             f.sessionId.toLowerCase().includes(query) ||
             f.fileName.toLowerCase().includes(query)
    )

    if (!match) {
      console.error(`File not found: ${args.file}`)
      console.error('Available files:')
      for (const f of files) {
        console.error(`  ${f.fileName} (${f.sessionId})`)
      }
      process.exit(1)
    }

    // Select the file
    const res = await fetch(`${PROXY_URL}/select-file`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: match.sessionId })
    })

    const result = (await res.json()) as { success?: boolean; error?: string; fileName?: string }

    if (result.error) {
      console.error('Error:', result.error)
      process.exit(1)
    }

    console.log(`✓ Selected: ${result.fileName}`)
  }
})

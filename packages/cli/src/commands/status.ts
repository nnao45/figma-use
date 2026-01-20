import { defineCommand } from 'citty'
import { getStatus, getFileKey, type PluginConnection } from '../client.ts'

export default defineCommand({
  meta: { description: 'Check connection status (plugin, DevTools, multiplayer)' },
  args: { json: { type: 'boolean', description: 'Output as JSON' } },
  async run({ args }) {
    const result = {
      proxy: false,
      plugin: false,
      devtools: false,
      fileKey: null as string | null,
      multiplayer: false,
      connections: [] as PluginConnection[]
    }

    // Check proxy
    try {
      const status = await getStatus()
      result.proxy = true
      result.plugin = status.pluginConnected
      result.connections = status.connections || []
    } catch {
      // Proxy not running
    }

    // Check DevTools (required for render command)
    try {
      result.fileKey = await getFileKey()
      result.devtools = true
      result.multiplayer = true // If we have fileKey, multiplayer can connect
    } catch {
      // DevTools not available or no Figma file open
    }

    if (args.json) {
      console.log(JSON.stringify(result, null, 2))
      return
    }

    // Human-readable output
    console.log(result.proxy ? '✓ Proxy running' : '✗ Proxy not running (run: figma-use proxy)')
    
    if (result.connections.length > 0) {
      console.log(`✓ Plugin connected (${result.connections.length} file${result.connections.length > 1 ? 's' : ''})`)
      for (const conn of result.connections) {
        const marker = conn.active ? '→' : ' '
        console.log(`  ${marker} ${conn.fileName} (${conn.sessionId})`)
      }
    } else {
      console.log('✗ Plugin not connected (open plugin in Figma)')
    }

    console.log(
      result.devtools
        ? '✓ DevTools available'
        : '✗ DevTools not available (run: figma --remote-debugging-port=9222)'
    )

    if (result.devtools) {
      if (result.fileKey) {
        console.log(`✓ Figma file ready (${result.fileKey})`)
      } else {
        console.log('✗ No Figma file open (open a file from figma.com, not local)')
      }
    }

    // Summary for render command
    if (result.proxy && result.plugin && result.multiplayer) {
      console.log('\n✓ Ready for render command')
    } else if (result.proxy && result.plugin) {
      console.log('\n⚠ CLI commands work, but render requires DevTools + Figma file')
    }

    if (!result.proxy) process.exit(1)
  }
})

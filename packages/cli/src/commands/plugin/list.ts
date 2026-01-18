import { defineCommand } from 'citty'
import { readFileSync, existsSync } from 'fs'
import { handleError } from '../../client.ts'
import { dim, accent } from '../../format.ts'
import { getFigmaSettingsPath } from './utils.ts'

interface PluginEntry {
  id: number
  manifestPath: string
  lastKnownName?: string
  lastKnownPluginId?: string
  fileMetadata?: { type: string }
}

export default defineCommand({
  meta: { description: 'List installed development plugins' },
  args: {
    json: { type: 'boolean', description: 'Output as JSON' }
  },
  async run({ args }) {
    try {
      const settingsPath = getFigmaSettingsPath()
      
      if (!settingsPath || !existsSync(settingsPath)) {
        console.log('No Figma settings found')
        return
      }
      
      const settings = JSON.parse(readFileSync(settingsPath, 'utf-8'))
      const extensions: PluginEntry[] = settings.localFileExtensions || []
      
      const plugins = extensions
        .filter(e => e.fileMetadata?.type === 'manifest')
        .map(e => ({
          id: e.lastKnownPluginId || 'unknown',
          name: e.lastKnownName || 'Unnamed',
          path: e.manifestPath
        }))
      
      if (args.json) {
        console.log(JSON.stringify(plugins, null, 2))
        return
      }
      
      if (plugins.length === 0) {
        console.log('No development plugins installed')
        return
      }
      
      for (const p of plugins) {
        console.log(`${accent(p.name)} ${dim(`(${p.id})`)}`)
        console.log(`  ${dim(p.path)}`)
      }
      
      console.log(`\n${plugins.length} plugin${plugins.length === 1 ? '' : 's'}`)
    } catch (e) { handleError(e) }
  }
})

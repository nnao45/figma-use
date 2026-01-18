import { defineCommand } from 'citty'
import { resolve, dirname, join } from 'path'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import consola from 'consola'
import { getFigmaSettingsPath, isFigmaRunning } from './utils.ts'

function getPackageRoot(): string {
  const currentFile = import.meta.path || import.meta.url.replace('file://', '')
  let dir = dirname(currentFile)
  
  for (let i = 0; i < 10; i++) {
    try {
      const pkg = require(resolve(dir, 'package.json'))
      if (pkg.name === '@dannote/figma-use') {
        return dir
      }
    } catch {}
    dir = dirname(dir)
  }
  
  return dirname(dirname(dirname(currentFile)))
}

function getNextId(extensions: Array<{ id: number }>): number {
  if (!extensions || extensions.length === 0) return 1
  return Math.max(...extensions.map(e => e.id)) + 1
}

function installPlugin(manifestPath: string, force = false): { success: boolean; message: string } {
  const settingsPath = getFigmaSettingsPath()
  
  if (!settingsPath || !existsSync(settingsPath)) {
    return { 
      success: false, 
      message: 'Figma settings not found. Please install Figma Desktop first.' 
    }
  }
  
  if (!force && isFigmaRunning()) {
    return {
      success: false,
      message: 'Figma is running. Quit Figma first or use --force'
    }
  }
  
  try {
    const settings = JSON.parse(readFileSync(settingsPath, 'utf-8'))
    const extensions = settings.localFileExtensions || []
    
    // Check if already installed (by plugin id, not path - path may differ)
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'))
    const pluginId = manifest.id || 'figma-use-plugin'
    
    const existing = extensions.find((e: { lastKnownPluginId?: string; fileMetadata?: { type: string } }) => 
      e.lastKnownPluginId === pluginId && e.fileMetadata?.type === 'manifest'
    )
    
    if (existing) {
      // Update path if changed
      if (existing.manifestPath !== manifestPath) {
        existing.manifestPath = manifestPath
        // Update code and ui paths too
        const pluginDir = dirname(manifestPath)
        for (const ext of extensions) {
          if (ext.fileMetadata?.manifestFileId === existing.id) {
            if (ext.fileMetadata.type === 'code') {
              ext.manifestPath = join(pluginDir, manifest.main || 'main.js')
            } else if (ext.fileMetadata.type === 'ui') {
              ext.manifestPath = join(pluginDir, manifest.ui || 'ui.html')
            }
          }
        }
        settings.localFileExtensions = extensions
        writeFileSync(settingsPath, JSON.stringify(settings))
        return { success: true, message: 'Plugin path updated' }
      }
      return { success: true, message: 'Plugin already installed' }
    }
    
    const pluginDir = dirname(manifestPath)
    
    const manifestId = getNextId(extensions)
    const codeId = manifestId + 1
    const uiId = manifestId + 2
    
    // Add manifest entry
    extensions.push({
      id: manifestId,
      manifestPath: manifestPath,
      lastKnownName: manifest.name || 'Figma Use',
      lastKnownPluginId: pluginId,
      fileMetadata: {
        type: 'manifest',
        codeFileId: codeId,
        uiFileIds: [uiId]
      },
      cachedContainsWidget: false
    })
    
    // Add code entry
    extensions.push({
      id: codeId,
      manifestPath: join(pluginDir, manifest.main || 'main.js'),
      fileMetadata: {
        type: 'code',
        manifestFileId: manifestId
      }
    })
    
    // Add UI entry
    extensions.push({
      id: uiId,
      manifestPath: join(pluginDir, manifest.ui || 'ui.html'),
      fileMetadata: {
        type: 'ui',
        manifestFileId: manifestId
      }
    })
    
    settings.localFileExtensions = extensions
    writeFileSync(settingsPath, JSON.stringify(settings))
    
    return { success: true, message: 'Plugin installed successfully' }
  } catch (error) {
    return { 
      success: false, 
      message: `Failed to install: ${error instanceof Error ? error.message : error}` 
    }
  }
}

function uninstallPlugin(manifestPath: string, force = false): { success: boolean; message: string } {
  const settingsPath = getFigmaSettingsPath()
  
  if (!settingsPath || !existsSync(settingsPath)) {
    return { success: false, message: 'Figma settings not found' }
  }
  
  if (!force && isFigmaRunning()) {
    return {
      success: false,
      message: 'Figma is running. Quit Figma first or use --force'
    }
  }
  
  try {
    const settings = JSON.parse(readFileSync(settingsPath, 'utf-8'))
    const extensions = settings.localFileExtensions || []
    
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'))
    const pluginId = manifest.id || 'figma-use-plugin'
    
    const manifestEntry = extensions.find((e: { lastKnownPluginId?: string; fileMetadata?: { type: string } }) => 
      e.lastKnownPluginId === pluginId && e.fileMetadata?.type === 'manifest'
    )
    
    if (!manifestEntry) {
      return { success: true, message: 'Plugin not installed' }
    }
    
    const manifestId = manifestEntry.id
    settings.localFileExtensions = extensions.filter((e: { id: number; fileMetadata?: { manifestFileId?: number } }) => 
      e.id !== manifestId && e.fileMetadata?.manifestFileId !== manifestId
    )
    
    writeFileSync(settingsPath, JSON.stringify(settings))
    
    return { success: true, message: 'Plugin uninstalled successfully' }
  } catch (error) {
    return { 
      success: false, 
      message: `Failed to uninstall: ${error instanceof Error ? error.message : error}` 
    }
  }
}

export default defineCommand({
  meta: { description: 'Install/uninstall Figma plugin' },
  args: {
    uninstall: { type: 'boolean', description: 'Uninstall the plugin' },
    path: { type: 'boolean', description: 'Show plugin path only' },
    force: { type: 'boolean', description: 'Force install even if Figma is running (not recommended)' }
  },
  async run({ args }) {
    const root = getPackageRoot()
    const pluginPath = resolve(root, 'packages', 'plugin', 'dist', 'manifest.json')
    
    if (args.path) {
      console.log(pluginPath)
      return
    }
    
    if (args.uninstall) {
      const result = uninstallPlugin(pluginPath, args.force)
      if (result.success) {
        consola.success(result.message)
      } else {
        consola.error(result.message)
      }
      return
    }
    
    const result = installPlugin(pluginPath, args.force)
    
    if (result.success) {
      consola.success(result.message)
      if (result.message !== 'Plugin already installed') {
        consola.box(`Next steps:

1. Start Figma
2. Open any Figma file
3. Run: figma-use proxy
4. In Figma: Plugins → Development → Figma Use`)
      }
    } else {
      consola.error(result.message)
      consola.box({
        title: 'Manual Installation',
        message: `1. Open Figma Desktop
2. Go to: Plugins → Development → Import plugin from manifest
3. Select: ${pluginPath}`
      })
    }
  }
})

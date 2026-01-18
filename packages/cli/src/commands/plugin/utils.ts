import { join } from 'path'
import { execSync } from 'child_process'

export function getFigmaSettingsPath(): string | null {
  const home = process.env.HOME || process.env.USERPROFILE || ''
  
  if (process.platform === 'darwin') {
    return join(home, 'Library', 'Application Support', 'Figma', 'settings.json')
  } else if (process.platform === 'win32') {
    const appData = process.env.APPDATA || join(home, 'AppData', 'Roaming')
    return join(appData, 'Figma', 'settings.json')
  } else {
    return join(home, '.config', 'Figma', 'settings.json')
  }
}

export function isFigmaRunning(): boolean {
  try {
    if (process.platform === 'darwin') {
      execSync('pgrep -x Figma', { stdio: 'pipe' })
      return true
    } else if (process.platform === 'win32') {
      execSync('tasklist /FI "IMAGENAME eq Figma.exe" | find "Figma.exe"', { stdio: 'pipe' })
      return true
    } else {
      execSync('pgrep -x figma', { stdio: 'pipe' })
      return true
    }
  } catch {
    return false
  }
}

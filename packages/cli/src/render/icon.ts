import { icons as heroiconsIcons } from '@iconify-json/heroicons'
// Bundled icon sets (loaded on first use)
import { icons as lucideIcons } from '@iconify-json/lucide'
import { icons as mdiIcons } from '@iconify-json/mdi'
import { icons as phIcons } from '@iconify-json/ph'
import { icons as tablerIcons } from '@iconify-json/tabler'
import { loadIcon } from '@iconify/core/lib/api/icons'
import { setAPIModule } from '@iconify/core/lib/api/modules'
import { fetchAPIModule } from '@iconify/core/lib/api/modules/fetch'
import { iconToSVG } from '@iconify/utils'

import type { ReactNode } from './mini-react.ts'
import type { Props, ReactElement } from './tree.ts'
import type { IconifyIcon, IconifyJSON } from '@iconify/types'

// Map of bundled icon sets
const bundledIconSets: Record<string, IconifyJSON> = {
  lucide: lucideIcons,
  mdi: mdiIcons,
  tabler: tablerIcons,
  heroicons: heroiconsIcons,
  ph: phIcons
}

// Initialize API module (for fallback to remote API)
setAPIModule('', fetchAPIModule)

export interface IconData {
  svg: string
  width: number
  height: number
  body: string
  viewBox: { left: number; top: number; width: number; height: number }
}

const iconCache = new Map<string, IconData>()

// Raw icon data cache (before size transformation)
const rawIconCache = new Map<string, IconifyIcon>()

/**
 * Try to get icon from bundled icon sets
 */
function getBundledIcon(name: string): IconifyIcon | null {
  const [prefix, iconName] = name.split(':')
  if (!prefix || !iconName) return null

  const iconSet = bundledIconSets[prefix]
  if (!iconSet) return null

  const iconData = iconSet.icons[iconName]
  if (!iconData) return null

  // Merge with default values from the icon set
  return {
    ...iconData,
    width: iconData.width ?? iconSet.width ?? 24,
    height: iconData.height ?? iconSet.height ?? 24
  }
}

/**
 * Load raw icon data (without size transformation)
 * Tries bundled icon sets first, falls back to API
 */
async function loadRawIcon(name: string): Promise<IconifyIcon | null> {
  if (rawIconCache.has(name)) {
    return rawIconCache.get(name)!
  }

  // Try bundled icon sets first (no network needed)
  const bundledIcon = getBundledIcon(name)
  if (bundledIcon) {
    rawIconCache.set(name, bundledIcon)
    return bundledIcon
  }

  // Fallback to API for non-bundled icon sets
  const icon = await loadIcon(name)
  if (!icon) {
    return null
  }

  rawIconCache.set(name, icon)
  return icon
}

/**
 * Load icon from Iconify and return SVG string
 * @param name Icon name in format "prefix:name" (e.g., "mdi:home", "lucide:star")
 * @param size Optional size (default: 24)
 */
export async function loadIconSvg(name: string, size: number = 24): Promise<IconData | null> {
  const cacheKey = `${name}@${size}`

  if (iconCache.has(cacheKey)) {
    return iconCache.get(cacheKey)!
  }

  const icon = await loadRawIcon(name)
  if (!icon) {
    return null
  }

  const result = iconToSVG(icon, { height: size, width: size })
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" ${Object.entries(result.attributes)
    .map(([k, v]) => `${k}="${v}"`)
    .join(' ')}>${result.body}</svg>`

  const data: IconData = {
    svg,
    width: size,
    height: size,
    body: result.body,
    viewBox: {
      left: result.viewBox[0],
      top: result.viewBox[1],
      width: result.viewBox[2],
      height: result.viewBox[3]
    }
  }

  iconCache.set(cacheKey, data)
  return data
}

/**
 * Get cached icon data (synchronous, for use in React components)
 * Returns null if icon not preloaded
 */
export function getIconData(name: string, size: number = 24): IconData | null {
  return iconCache.get(`${name}@${size}`) || null
}

/**
 * Preload icons for use in JSX render
 * Call before rendering to ensure icons are available synchronously
 */
export async function preloadIcons(icons: Array<{ name: string; size?: number }>): Promise<void> {
  await Promise.all(icons.map(({ name, size }) => loadIconSvg(name, size || 24)))
}

/**
 * Get list of bundled icon set prefixes
 */
export const bundledIconSetPrefixes = Object.keys(bundledIconSets)

/**
 * Check if an icon set is bundled (available offline)
 */
export function isIconSetBundled(prefix: string): boolean {
  return prefix in bundledIconSets
}

/**
 * Get list of popular icon sets
 * Sets marked with (bundled) are available offline
 */
export const iconSets = {
  lucide: 'Lucide (bundled)',
  mdi: 'Material Design Icons (bundled)',
  tabler: 'Tabler Icons (bundled)',
  heroicons: 'Heroicons (bundled)',
  ph: 'Phosphor (bundled)',
  'heroicons-outline': 'Heroicons Outline',
  'heroicons-solid': 'Heroicons Solid',
  'fa-solid': 'Font Awesome Solid',
  'fa-regular': 'Font Awesome Regular',
  'fa-brands': 'Font Awesome Brands',
  ri: 'Remix Icon',
  'ph-bold': 'Phosphor Bold',
  'ph-fill': 'Phosphor Fill',
  carbon: 'Carbon',
  fluent: 'Fluent UI',
  ion: 'Ionicons',
  bi: 'Bootstrap Icons'
}

/**
 * Recursively collect Icon primitives from React element tree
 */
export function collectIcons(element: ReactNode): Array<{ name: string; size?: number }> {
  const icons: Array<{ name: string; size?: number }> = []

  function traverse(node: ReactNode): void {
    if (!node || typeof node !== 'object') return

    if (Array.isArray(node)) {
      node.forEach(traverse)
      return
    }

    const el = node as ReactElement
    if (!el.type) return

    if (el.type === 'icon') {
      const props = el.props as { icon?: string; size?: number }
      if (props.icon) {
        icons.push({ name: props.icon, size: props.size })
      }
    }

    if (typeof el.type === 'function') {
      try {
        const rendered = (el.type as (p: Props) => ReactNode)(el.props as Props)
        if (rendered) traverse(rendered)
      } catch {
        // Ignore render errors during collection
      }
    }

    const props = el.props as { children?: ReactNode }
    if (props.children) {
      if (Array.isArray(props.children)) {
        props.children.forEach(traverse)
      } else {
        traverse(props.children)
      }
    }
  }

  traverse(element)
  return icons
}

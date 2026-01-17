/**
 * Color utilities using culori
 */

import { parse, formatHex, formatRgb, converter } from 'culori'

const toRgb = converter('rgb')

export interface RGBA {
  r: number
  g: number
  b: number
  a: number
}

/**
 * Parse any color string to RGBA (0-1 range)
 * Supports: hex, rgb(), rgba(), hsl(), hsla(), named colors, etc.
 */
export function parseColor(color: string): RGBA {
  const parsed = parse(color)
  
  if (!parsed) {
    return { r: 0, g: 0, b: 0, a: 1 }
  }
  
  const rgb = toRgb(parsed)
  
  return {
    r: rgb?.r ?? 0,
    g: rgb?.g ?? 0,
    b: rgb?.b ?? 0,
    a: parsed.alpha ?? 1,
  }
}

/**
 * Convert RGBA to Figma fill paint
 */
export function colorToFill(color: string | RGBA) {
  const rgba = typeof color === 'string' ? parseColor(color) : color
  return {
    type: 'SOLID' as const,
    color: { r: rgba.r, g: rgba.g, b: rgba.b, a: rgba.a },
    opacity: rgba.a,
    visible: true,
  }
}

/**
 * Format RGBA to hex string
 */
export function rgbaToHex(color: RGBA): string {
  return formatHex({ mode: 'rgb', r: color.r, g: color.g, b: color.b }) ?? '#000000'
}

/**
 * Format RGBA to rgb() or rgba() string
 */
export function rgbaToRgb(color: RGBA): string {
  return formatRgb({ mode: 'rgb', r: color.r, g: color.g, b: color.b, alpha: color.a })
}

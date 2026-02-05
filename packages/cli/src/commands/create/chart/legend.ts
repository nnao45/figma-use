import type { DataPoint } from './d3-utils.ts'

export interface LegendOptions {
  data: DataPoint[]
  colors: string[]
  x: number
  y: number
  itemHeight?: number
  itemSpacing?: number
  boxSize?: number
}

export function createLegendSvg(options: LegendOptions): string {
  const { data, colors, x, y, itemHeight = 20, itemSpacing = 4, boxSize = 12 } = options

  const items = data
    .map((d, i) => {
      const itemY = y + i * (itemHeight + itemSpacing)
      const color = colors[i % colors.length]
      return `
      <rect x="${x}" y="${itemY}" width="${boxSize}" height="${boxSize}" fill="${color}" />
      <text x="${x + boxSize + 8}" y="${itemY + boxSize - 2}" font-family="system-ui, sans-serif" font-size="12" fill="#374151">${escapeXml(d.label)}</text>
    `
    })
    .join('')

  return items
}

export function calculateLegendWidth(data: DataPoint[]): number {
  // Estimate legend width based on longest label
  const maxLabelLength = Math.max(...data.map((d) => d.label.length))
  return 12 + 8 + maxLabelLength * 7 + 10 // boxSize + gap + text + padding
}

export function calculateLegendHeight(data: DataPoint[], itemHeight = 20, itemSpacing = 4): number {
  return data.length * (itemHeight + itemSpacing) - itemSpacing
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

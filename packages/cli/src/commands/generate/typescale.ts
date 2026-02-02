import { defineCommand } from 'citty'

import { sendCommand, handleError } from '../../client.ts'
import { ok, dim } from '../../format.ts'

/**
 * Typography Scale Generator
 *
 * Generates a harmonious type scale using musical/mathematical ratios.
 * Supports common scales like Major Third (1.25), Perfect Fourth (1.333), etc.
 */

export const SCALE_RATIOS: Record<string, number> = {
  'minor-second': 1.067,
  'major-second': 1.125,
  'minor-third': 1.2,
  'major-third': 1.25,
  'perfect-fourth': 1.333,
  'augmented-fourth': 1.414,
  'perfect-fifth': 1.5,
  'golden-ratio': 1.618
}

export const SCALE_NAMES = [
  'xs',
  'sm',
  'base',
  'lg',
  'xl',
  '2xl',
  '3xl',
  '4xl',
  '5xl',
  '6xl'
]

export interface TypeStep {
  name: string
  fontSize: number
  lineHeight: number
  letterSpacing: number
  weight: number
}

/**
 * Compute line-height for a given font size.
 * Smaller sizes need more relative spacing; larger sizes need less.
 */
function computeLineHeight(fontSize: number): number {
  // Ratio decreases as font size grows
  if (fontSize <= 12) return Math.round(fontSize * 1.7)
  if (fontSize <= 16) return Math.round(fontSize * 1.6)
  if (fontSize <= 24) return Math.round(fontSize * 1.45)
  if (fontSize <= 36) return Math.round(fontSize * 1.3)
  return Math.round(fontSize * 1.2)
}

/**
 * Compute letter-spacing in em.
 * Larger sizes get tighter tracking; smaller sizes get wider.
 */
function computeLetterSpacing(fontSize: number): number {
  if (fontSize >= 48) return -0.025
  if (fontSize >= 36) return -0.02
  if (fontSize >= 24) return -0.01
  if (fontSize >= 18) return 0
  if (fontSize >= 14) return 0.01
  return 0.02
}

/**
 * Suggested font weight for each step
 */
function computeWeight(name: string): number {
  switch (name) {
    case 'xs':
    case 'sm':
      return 400
    case 'base':
      return 400
    case 'lg':
      return 500
    case 'xl':
    case '2xl':
      return 600
    case '3xl':
    case '4xl':
      return 700
    case '5xl':
    case '6xl':
      return 800
    default:
      return 400
  }
}

/**
 * Generate a type scale.
 *
 * @param base - Base font size in px (default 16)
 * @param ratio - Scale ratio (default 1.25 = Major Third)
 * @param steps - Number of steps (default 10)
 */
export function generateTypescale(
  base: number = 16,
  ratio: number = 1.25,
  steps: number = 10
): TypeStep[] {
  const names = SCALE_NAMES.slice(0, steps)
  const baseIndex = names.indexOf('base')

  return names.map((name, i) => {
    const power = i - baseIndex
    const rawSize = base * Math.pow(ratio, power)
    const fontSize = Math.round(rawSize * 2) / 2 // Round to nearest 0.5

    return {
      name,
      fontSize,
      lineHeight: computeLineHeight(fontSize),
      letterSpacing: computeLetterSpacing(fontSize),
      weight: computeWeight(name)
    }
  })
}

export default defineCommand({
  meta: { description: 'Generate a typography scale' },
  args: {
    base: {
      type: 'string',
      description: 'Base font size in px',
      default: '16'
    },
    ratio: {
      type: 'string',
      description:
        'Scale ratio or preset: minor-second, major-second, minor-third, major-third, perfect-fourth, augmented-fourth, perfect-fifth, golden-ratio',
      default: 'major-third'
    },
    font: {
      type: 'string',
      description: 'Font family',
      default: 'Inter'
    },
    steps: {
      type: 'string',
      description: 'Number of steps (max 10)',
      default: '10'
    },
    'create-styles': {
      type: 'boolean',
      description: 'Create Figma text styles for each step'
    },
    preview: {
      type: 'boolean',
      description: 'Render a visual preview in Figma'
    },
    json: { type: 'boolean', description: 'Output as JSON' }
  },
  async run({ args }) {
    try {
      const base = Number(args.base)
      const stepsCount = Math.min(Number(args.steps), 10)
      const font = args.font || 'Inter'

      // Resolve ratio
      let ratio: number
      const ratioStr = args.ratio || 'major-third'
      if (SCALE_RATIOS[ratioStr]) {
        ratio = SCALE_RATIOS[ratioStr]!
      } else {
        ratio = Number(ratioStr)
        if (isNaN(ratio) || ratio <= 1) {
          console.error(
            `Invalid ratio "${ratioStr}". Use a number > 1 or preset: ${Object.keys(SCALE_RATIOS).join(', ')}`
          )
          process.exit(1)
        }
      }

      const scale = generateTypescale(base, ratio, stepsCount)

      if (args.json) {
        console.log(JSON.stringify({ font, base, ratio, scale }, null, 2))
        return
      }

      const ratioName = SCALE_RATIOS[ratioStr] ? `${ratioStr} (${ratio})` : String(ratio)
      console.log(ok(`Type scale: ${font} · base ${base}px · ratio ${ratioName}\n`))

      console.log('  Name    Size     Line-H   Tracking   Weight')
      console.log('  ' + '─'.repeat(50))

      for (const step of scale) {
        const marker = step.name === 'base' ? ' ◀' : ''
        const tracking =
          step.letterSpacing === 0
            ? '  0'
            : step.letterSpacing > 0
              ? `+${step.letterSpacing.toFixed(3)}`
              : step.letterSpacing.toFixed(3)
        console.log(
          `  ${step.name.padEnd(6)}  ${String(step.fontSize + 'px').padEnd(8)} ${String(step.lineHeight + 'px').padEnd(8)} ${tracking.padStart(7)}em  ${step.weight}${marker}`
        )
      }

      // Create Figma text styles
      if (args['create-styles']) {
        console.log(dim(`\n  Creating ${scale.length} text styles...`))
        for (const step of scale) {
          await sendCommand('create-text-style', {
            name: `${font}/${step.name}`,
            fontFamily: font,
            fontSize: step.fontSize,
            lineHeight: step.lineHeight,
            fontWeight: step.weight
          })
        }
        console.log(ok(`  Created ${scale.length} text styles: ${font}/xs → ${font}/6xl`))
      }

      // Render preview
      if (args.preview) {
        console.log(dim('\n  Rendering type scale preview...'))
        const { renderFromString } = await import('../../render/index.ts')
        const items = scale
          .slice()
          .reverse()
          .map(
            (step) =>
              `<Frame flex="row" gap={16} items="center" w="fill">
              <Text size={12} color="#94A3B8" font="monospace" w={60}>${step.name}</Text>
              <Text size={12} color="#94A3B8" w={50}>${step.fontSize}px</Text>
              <Text size={${step.fontSize}} weight={${step.weight}} font="${font}" color="#0F172A">${step.name === 'base' ? 'The quick brown fox' : 'Aa'}</Text>
            </Frame>`
          )
          .join('\n        ')

        const jsx = `
  <Frame name="Type Scale" flex="col" gap={16} p={32} bg="#FFFFFF" rounded={16}>
    <Text size={18} weight="bold" color="#0F172A">Type Scale · ${font}</Text>
    <Text size={12} color="#64748B">Base: ${base}px · Ratio: ${ratioName}</Text>
    <Frame flex="col" gap={20} pt={8}>
      ${items}
    </Frame>
  </Frame>`
        const result = await renderFromString(jsx)
        console.log(ok(`  Preview rendered: ${result.id}`))
      }
    } catch (e) {
      handleError(e)
    }
  }
})

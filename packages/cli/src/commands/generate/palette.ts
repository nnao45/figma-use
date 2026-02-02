import { defineCommand } from 'citty'

import { sendCommand, handleError, printResult } from '../../client.ts'
import { ok, dim } from '../../format.ts'

/**
 * Color palette generation utilities
 *
 * Generates 11 shades (50–950) from a base color using HSL manipulation,
 * similar to Tailwind CSS color scales.
 */

interface PaletteShade {
  step: number
  hex: string
  hsl: { h: number; s: number; l: number }
}

function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const clean = hex.replace('#', '')
  const r = parseInt(clean.slice(0, 2), 16) / 255
  const g = parseInt(clean.slice(2, 4), 16) / 255
  const b = parseInt(clean.slice(4, 6), 16) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  let h = 0
  let s = 0

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6
        break
      case g:
        h = ((b - r) / d + 2) / 6
        break
      case b:
        h = ((r - g) / d + 4) / 6
        break
    }
  }

  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) }
}

function hslToHex(h: number, s: number, l: number): string {
  s /= 100
  l /= 100
  const a = s * Math.min(l, 1 - l)
  const f = (n: number) => {
    const k = (n + h / 30) % 12
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)
    return Math.round(255 * Math.max(0, Math.min(1, color)))
      .toString(16)
      .padStart(2, '0')
  }
  return `#${f(0)}${f(8)}${f(4)}`.toUpperCase()
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val))
}

/**
 * Generate Tailwind-style color palette (50-950 shades) from a base color.
 *
 * The base color is placed at the 500 step. Lighter steps increase lightness
 * and decrease saturation slightly; darker steps decrease lightness and shift
 * saturation for richness.
 */
export function generatePalette(baseHex: string): PaletteShade[] {
  const base = hexToHsl(baseHex)
  const steps = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]

  // Lightness curve: maps step → target lightness
  // 50 → ~97, 500 → base.l, 950 → ~5
  const lightnessMap: Record<number, number> = {
    50: 97,
    100: 94,
    200: 86,
    300: 77,
    400: 66,
    500: base.l,
    600: clamp(base.l - 12, 15, 55),
    700: clamp(base.l - 24, 12, 42),
    800: clamp(base.l - 34, 10, 32),
    900: clamp(base.l - 42, 8, 22),
    950: clamp(base.l - 48, 4, 14)
  }

  // Saturation adjustments: lightest and darkest steps desaturate slightly
  const saturationMap: Record<number, number> = {
    50: clamp(base.s - 20, 10, 100),
    100: clamp(base.s - 10, 15, 100),
    200: clamp(base.s - 5, 20, 100),
    300: base.s,
    400: base.s,
    500: base.s,
    600: clamp(base.s + 3, 0, 100),
    700: clamp(base.s + 5, 0, 100),
    800: clamp(base.s + 3, 0, 100),
    900: clamp(base.s - 5, 0, 100),
    950: clamp(base.s - 10, 0, 100)
  }

  return steps.map((step) => {
    const l = lightnessMap[step]!
    const s = saturationMap[step]!
    const hex = hslToHex(base.h, s, l)
    return { step, hex, hsl: { h: base.h, s, l } }
  })
}

/**
 * Get relative luminance for WCAG contrast calculation
 */
function relativeLuminance(hex: string): number {
  const clean = hex.replace('#', '')
  const r = parseInt(clean.slice(0, 2), 16) / 255
  const g = parseInt(clean.slice(2, 4), 16) / 255
  const b = parseInt(clean.slice(4, 6), 16) / 255

  const toLinear = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b)
}

/**
 * Calculate WCAG contrast ratio between two colors
 */
export function contrastRatio(hex1: string, hex2: string): number {
  const l1 = relativeLuminance(hex1)
  const l2 = relativeLuminance(hex2)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

export default defineCommand({
  meta: { description: 'Generate a color palette from a base color' },
  args: {
    color: {
      type: 'positional',
      description: 'Base color (hex, e.g. #3B82F6)',
      required: true
    },
    name: {
      type: 'string',
      description: 'Palette name (e.g. "Blue", "Primary")',
      default: 'Color'
    },
    'create-styles': {
      type: 'boolean',
      description: 'Create Figma paint styles for each shade'
    },
    'create-variables': {
      type: 'boolean',
      description: 'Create Figma variables for each shade'
    },
    preview: {
      type: 'boolean',
      description: 'Render a visual preview swatch in Figma'
    },
    json: { type: 'boolean', description: 'Output as JSON' }
  },
  async run({ args }) {
    try {
      const baseColor = args.color.startsWith('#') ? args.color : `#${args.color}`

      if (!/^#[0-9A-Fa-f]{6}$/.test(baseColor)) {
        console.error('Invalid hex color. Use format: #RRGGBB (e.g. #3B82F6)')
        process.exit(1)
      }

      const name = args.name || 'Color'
      const palette = generatePalette(baseColor)

      if (args.json) {
        console.log(
          JSON.stringify(
            {
              name,
              base: baseColor,
              shades: palette.map((s) => ({
                step: s.step,
                hex: s.hex,
                contrastOnWhite: +contrastRatio(s.hex, '#FFFFFF').toFixed(2),
                contrastOnBlack: +contrastRatio(s.hex, '#000000').toFixed(2)
              }))
            },
            null,
            2
          )
        )
        return
      }

      console.log(ok(`Palette "${name}" from ${baseColor}\n`))
      console.log('  Step   Hex       vs White  vs Black')
      console.log('  ' + '─'.repeat(42))

      for (const shade of palette) {
        const cw = contrastRatio(shade.hex, '#FFFFFF').toFixed(1)
        const cb = contrastRatio(shade.hex, '#000000').toFixed(1)
        const wcagW = Number(cw) >= 4.5 ? ' AA' : Number(cw) >= 3.0 ? ' aa' : '   '
        const wcagB = Number(cb) >= 4.5 ? ' AA' : Number(cb) >= 3.0 ? ' aa' : '   '
        const marker = shade.step === 500 ? ' ◀ base' : ''
        console.log(
          `  ${String(shade.step).padStart(4)}   ${shade.hex}   ${cw.padStart(5)}${wcagW}  ${cb.padStart(5)}${wcagB}${marker}`
        )
      }
      console.log()
      console.log(dim('  AA = WCAG AA (≥4.5:1)  aa = WCAG AA large text (≥3:1)'))

      // Create Figma paint styles
      if (args['create-styles']) {
        console.log(dim(`\n  Creating ${palette.length} paint styles...`))
        for (const shade of palette) {
          await sendCommand('create-paint-style', {
            name: `${name}/${shade.step}`,
            color: shade.hex
          })
        }
        console.log(ok(`  Created ${palette.length} styles: ${name}/50 → ${name}/950`))
      }

      // Create Figma variables
      if (args['create-variables']) {
        console.log(dim(`\n  Creating variable collection "${name}"...`))
        const collection = (await sendCommand('create-collection', {
          name
        })) as { id: string }
        for (const shade of palette) {
          await sendCommand('create-variable', {
            name: `${name}/${shade.step}`,
            type: 'COLOR',
            collectionId: collection.id,
            value: shade.hex
          })
        }
        console.log(ok(`  Created ${palette.length} variables in "${name}" collection`))
      }

      // Render preview
      if (args.preview) {
        console.log(dim('\n  Rendering preview swatch...'))
        const { renderFromString } = await import('../../render/index.ts')
        const swatchItems = palette
          .map(
            (s) =>
              `<Frame w={80} h={80} bg="${s.hex}" rounded={8} flex="col" justify="end" p={6}>
              <Text size={10} weight="bold" color="${s.hsl.l > 55 ? '#000000' : '#FFFFFF'}">${s.step}</Text>
            </Frame>`
          )
          .join('\n        ')

        const jsx = `
  <Frame name="${name} Palette" flex="col" gap={12} p={24} bg="#F8FAFC" rounded={16}>
    <Text size={18} weight="bold" color="#0F172A">${name} Palette</Text>
    <Text size={12} color="#64748B">Base: ${baseColor}</Text>
    <Frame flex="row" gap={4}>
      ${swatchItems}
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

import { defineCommand } from 'citty'

import { sendCommand, handleError } from '../../client.ts'
import { ok, dim } from '../../format.ts'

/**
 * Spacing System Generator
 *
 * Generates a consistent spacing scale based on a base unit (default 4px or 8px).
 * Supports linear (base × multiplier) and exponential growth patterns.
 */

export interface SpacingStep {
  name: string
  value: number
  rem: number
  use: string
}

const SPACING_USAGE: Record<string, string> = {
  '0': 'none',
  '0.5': 'hairline borders',
  '1': 'tight inline spacing',
  '1.5': 'compact inline spacing',
  '2': 'inline elements, icon gaps',
  '3': 'tight component padding',
  '4': 'component padding, list gaps',
  '5': 'card padding, form spacing',
  '6': 'section padding (compact)',
  '8': 'section padding (normal)',
  '10': 'large section padding',
  '12': 'page section gaps',
  '16': 'page-level spacing',
  '20': 'large section spacing',
  '24': 'hero/banner padding'
}

/**
 * Generate a spacing scale.
 *
 * @param base - Base unit in px (default 4)
 * @param system - Scale system: "4pt" (4px base) or "8pt" (8px base)
 */
export function generateSpacing(base: number = 4, system: '4pt' | '8pt' = '4pt'): SpacingStep[] {
  const multipliers =
    system === '8pt'
      ? [0, 0.5, 1, 1.5, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24]
      : [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 16, 20, 24]

  return multipliers.map((m) => {
    const value = base * m
    return {
      name: String(m),
      value,
      rem: +(value / 16).toFixed(4),
      use: SPACING_USAGE[String(m)] || ''
    }
  })
}

export default defineCommand({
  meta: { description: 'Generate a spacing system' },
  args: {
    base: {
      type: 'string',
      description: 'Base unit in px',
      default: '4'
    },
    system: {
      type: 'string',
      description: 'Scale system: "4pt" or "8pt"',
      default: '4pt'
    },
    name: {
      type: 'string',
      description: 'Spacing collection name',
      default: 'Spacing'
    },
    'create-variables': {
      type: 'boolean',
      description: 'Create Figma variables for each step'
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
      const system = args.system === '8pt' ? '8pt' : '4pt'
      const name = args.name || 'Spacing'

      if (base <= 0) {
        console.error('Base must be a positive number')
        process.exit(1)
      }

      const scale = generateSpacing(base, system as '4pt' | '8pt')

      if (args.json) {
        console.log(JSON.stringify({ name, base, system, scale }, null, 2))
        return
      }

      console.log(ok(`Spacing system: ${system} grid · base ${base}px\n`))

      console.log('  Token    px     rem       Use')
      console.log('  ' + '─'.repeat(52))

      for (const step of scale) {
        const px = String(step.value + 'px').padEnd(7)
        const rem = String(step.rem + 'rem').padEnd(10)
        const use = step.use ? dim(step.use) : ''
        console.log(`  ${step.name.padEnd(7)}  ${px} ${rem} ${use}`)
      }

      console.log()
      console.log(dim(`  ${scale.length} tokens · base unit: ${base}px`))

      // Create Figma variables
      if (args['create-variables']) {
        console.log(dim(`\n  Creating variable collection "${name}"...`))
        const collection = (await sendCommand('create-collection', {
          name
        })) as { id: string }
        for (const step of scale) {
          await sendCommand('create-variable', {
            name: `${name}/${step.name}`,
            type: 'FLOAT',
            collectionId: collection.id,
            value: step.value
          })
        }
        console.log(ok(`  Created ${scale.length} variables in "${name}" collection`))
      }

      // Render preview
      if (args.preview) {
        console.log(dim('\n  Rendering spacing preview...'))
        const { renderFromString } = await import('../../render/index.ts')

        // Show first 12 non-zero items to keep preview manageable
        const items = scale
          .filter((s) => s.value > 0)
          .slice(0, 12)
          .map(
            (step) =>
              `<Frame flex="row" gap={12} items="center" w="fill">
              <Text size={11} color="#94A3B8" font="monospace" w={40}>${step.name}</Text>
              <Text size={11} color="#94A3B8" w={45}>${step.value}px</Text>
              <Frame w={${Math.min(step.value * 2, 400)}} h={16} bg="#3B82F6" rounded={2} />
            </Frame>`
          )
          .join('\n        ')

        const jsx = `
  <Frame name="${name}" flex="col" gap={8} p={32} bg="#FFFFFF" rounded={16}>
    <Text size={18} weight="bold" color="#0F172A">Spacing System</Text>
    <Text size={12} color="#64748B">${system} grid · base ${base}px</Text>
    <Frame flex="col" gap={8} pt={8}>
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

import { defineCommand } from 'citty'

import { handleError } from '../../client.ts'
import { ok } from '../../format.ts'
import { renderFromString } from '../../render/index.ts'

export default defineCommand({
  meta: { description: 'Create a card component template' },
  args: {
    title: { type: 'string', description: 'Card title', default: 'Card Title' },
    description: {
      type: 'string',
      description: 'Card description',
      default: 'A brief description of the card content goes here.'
    },
    width: { type: 'string', description: 'Card width', default: '340' },
    variant: {
      type: 'string',
      description: 'Card variant: default, outlined, elevated',
      default: 'default'
    },
    image: { type: 'boolean', description: 'Include image placeholder' },
    cta: { type: 'string', description: 'Call-to-action button text' },
    parent: { type: 'string', description: 'Parent node ID' },
    x: { type: 'string', description: 'X position' },
    y: { type: 'string', description: 'Y position' },
    json: { type: 'boolean', description: 'Output JSX instead of rendering' }
  },
  async run({ args }) {
    try {
      const w = Number(args.width)
      const title = args.title || 'Card Title'
      const desc = args.description || 'A brief description of the card content goes here.'

      // Variant styles
      const variants: Record<string, { bg: string; stroke: string; shadow: string }> = {
        default: { bg: '#FFFFFF', stroke: '', shadow: '0px 1px 3px #00000026' },
        outlined: { bg: '#FFFFFF', stroke: ' stroke="#E2E8F0" strokeWidth={1}', shadow: '' },
        elevated: { bg: '#FFFFFF', stroke: '', shadow: '0px 4px 16px #00000014' }
      }
      const v = variants[args.variant || 'default'] || variants.default!

      const shadowProp = v.shadow ? ` shadow="${v.shadow}"` : ''
      const strokeProp = v.stroke

      const imageBlock = args.image
        ? `<Frame w="fill" h={${Math.round(w * 0.56)}} bg="#E2E8F0" name="Image Placeholder">
          <Text size={14} color="#94A3B8" position="absolute" x={${Math.round(w / 2 - 30)}} y={${Math.round((w * 0.56) / 2 - 8)}}>Image</Text>
        </Frame>`
        : ''

      const ctaBlock = args.cta
        ? `<Frame w="fill" pt={4}>
          <Frame bg="#3B82F6" rounded={8} px={16} py={10} flex="row" justify="center">
            <Text size={14} weight="bold" color="#FFFFFF">${args.cta}</Text>
          </Frame>
        </Frame>`
        : ''

      const jsx = `
<Frame name="Card" w={${w}} flex="col" bg="${v.bg}" rounded={12}${shadowProp}${strokeProp} overflow="hidden">
  ${imageBlock}
  <Frame flex="col" gap={8} p={20} w="fill">
    <Text size={18} weight={600} color="#0F172A">${title}</Text>
    <Text size={14} color="#64748B">${desc}</Text>
    ${ctaBlock}
  </Frame>
</Frame>`

      if (args.json) {
        console.log(jsx.trim())
        return
      }

      const result = await renderFromString(jsx, {
        parent: args.parent,
        x: args.x ? Number(args.x) : undefined,
        y: args.y ? Number(args.y) : undefined
      })
      console.log(ok(`Card rendered: ${result.id}`))
    } catch (e) {
      handleError(e)
    }
  }
})

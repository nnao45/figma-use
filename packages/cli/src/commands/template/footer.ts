import { defineCommand } from 'citty'

import { handleError } from '../../client.ts'
import { ok } from '../../format.ts'
import { renderFromString } from '../../render/index.ts'

export default defineCommand({
  meta: { description: 'Create a footer template' },
  args: {
    brand: { type: 'string', description: 'Brand name', default: 'Brand' },
    tagline: {
      type: 'string',
      description: 'Brand tagline',
      default: 'Build better products.'
    },
    columns: {
      type: 'string',
      description: 'Columns as "Title:Link1,Link2|Title2:Link3,Link4"',
      default: 'Product:Features,Pricing,Changelog|Company:About,Blog,Careers|Legal:Privacy,Terms'
    },
    width: { type: 'string', description: 'Footer width', default: '1280' },
    variant: {
      type: 'string',
      description: 'Variant: light, dark',
      default: 'light'
    },
    parent: { type: 'string', description: 'Parent node ID' },
    x: { type: 'string', description: 'X position' },
    y: { type: 'string', description: 'Y position' },
    json: { type: 'boolean', description: 'Output JSX instead of rendering' }
  },
  async run({ args }) {
    try {
      const w = Number(args.width)
      const brand = args.brand || 'Brand'
      const tagline = args.tagline || 'Build better products.'

      const themes: Record<string, { bg: string; text: string; heading: string; sub: string; border: string }> = {
        light: {
          bg: '#F8FAFC',
          text: '#64748B',
          heading: '#0F172A',
          sub: '#94A3B8',
          border: '#E2E8F0'
        },
        dark: {
          bg: '#0F172A',
          text: '#94A3B8',
          heading: '#F8FAFC',
          sub: '#64748B',
          border: '#1E293B'
        }
      }

      const t = themes[args.variant || 'light'] || themes.light!

      // Parse columns
      const columnsStr =
        args.columns ||
        'Product:Features,Pricing,Changelog|Company:About,Blog,Careers|Legal:Privacy,Terms'
      const columns = columnsStr.split('|').map((col) => {
        const [titleRaw, linksRaw] = col.split(':')
        const title = (titleRaw || '').trim()
        const links = (linksRaw || '').split(',').map((l) => l.trim())
        return { title, links }
      })

      const columnBlocks = columns
        .map(
          (col) =>
            `<Frame flex="col" gap={12} grow={1}>
          <Text size={14} weight={600} color="${t.heading}">${col.title}</Text>
          ${col.links.map((link) => `<Text size={14} color="${t.text}">${link}</Text>`).join('\n          ')}
        </Frame>`
        )
        .join('\n      ')

      const year = new Date().getFullYear()

      const jsx = `
<Frame name="Footer" w={${w}} flex="col" bg="${t.bg}" px={48} pt={48} pb={32} gap={32}>
  <Frame flex="row" gap={64} w="fill">
    <Frame flex="col" gap={8} w={240}>
      <Text size={18} weight={700} color="${t.heading}">${brand}</Text>
      <Text size={14} color="${t.text}">${tagline}</Text>
    </Frame>
    <Frame flex="row" gap={48} grow={1}>
      ${columnBlocks}
    </Frame>
  </Frame>
  <Frame w="fill" h={1} bg="${t.border}" />
  <Text size={13} color="${t.sub}">\u00A9 ${year} ${brand}. All rights reserved.</Text>
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
      console.log(ok(`Footer rendered: ${result.id}`))
    } catch (e) {
      handleError(e)
    }
  }
})

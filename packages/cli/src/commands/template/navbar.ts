import { defineCommand } from 'citty'

import { handleError } from '../../client.ts'
import { ok } from '../../format.ts'
import { renderFromString } from '../../render/index.ts'

export default defineCommand({
  meta: { description: 'Create a navigation bar template' },
  args: {
    brand: { type: 'string', description: 'Brand/logo text', default: 'Brand' },
    links: {
      type: 'string',
      description: 'Comma-separated nav links',
      default: 'Home,Features,Pricing,About'
    },
    cta: { type: 'string', description: 'CTA button text', default: 'Sign Up' },
    width: { type: 'string', description: 'Navbar width', default: '1280' },
    variant: {
      type: 'string',
      description: 'Variant: light, dark, transparent',
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
      const links = (args.links || 'Home,Features,Pricing,About').split(',').map((l) => l.trim())
      const cta = args.cta || 'Sign Up'

      const themes: Record<string, { bg: string; text: string; active: string; btn: string; btnText: string; border: string }> = {
        light: {
          bg: '#FFFFFF',
          text: '#475569',
          active: '#0F172A',
          btn: '#0F172A',
          btnText: '#FFFFFF',
          border: ' stroke="#F1F5F9" strokeWidth={1}'
        },
        dark: {
          bg: '#0F172A',
          text: '#94A3B8',
          active: '#F8FAFC',
          btn: '#3B82F6',
          btnText: '#FFFFFF',
          border: ' stroke="#1E293B" strokeWidth={1}'
        },
        transparent: {
          bg: 'transparent',
          text: '#475569',
          active: '#0F172A',
          btn: '#3B82F6',
          btnText: '#FFFFFF',
          border: ''
        }
      }

      const t = themes[args.variant || 'light'] || themes.light!

      const navLinks = links
        .map(
          (link, i) =>
            `<Text size={14} weight={${i === 0 ? 600 : 400}} color="${i === 0 ? t.active : t.text}">${link}</Text>`
        )
        .join('\n          ')

      const jsx = `
<Frame name="Navbar" w={${w}} h={64} flex="row" items="center" justify="between" px={24} bg="${t.bg}"${t.border} strokeAlign="inside">
  <Frame flex="row" items="center" gap={32}>
    <Text size={18} weight={700} color="${t.active}">${brand}</Text>
    <Frame flex="row" gap={24} items="center">
      ${navLinks}
    </Frame>
  </Frame>
  <Frame bg="${t.btn}" rounded={8} px={16} py={8} flex="row" justify="center">
    <Text size={14} weight={600} color="${t.btnText}">${cta}</Text>
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
      console.log(ok(`Navbar rendered: ${result.id}`))
    } catch (e) {
      handleError(e)
    }
  }
})

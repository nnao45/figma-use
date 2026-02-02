import { defineCommand } from 'citty'

import { handleError } from '../../client.ts'
import { ok } from '../../format.ts'
import { renderFromString } from '../../render/index.ts'

export default defineCommand({
  meta: { description: 'Create a hero section template' },
  args: {
    title: {
      type: 'string',
      description: 'Hero title',
      default: 'Build beautiful designs faster'
    },
    subtitle: {
      type: 'string',
      description: 'Hero subtitle',
      default: 'Create stunning interfaces with a modern design system that scales with your team.'
    },
    cta: { type: 'string', description: 'Primary CTA text', default: 'Get Started' },
    'cta-secondary': { type: 'string', description: 'Secondary CTA text', default: 'Learn More' },
    width: { type: 'string', description: 'Section width', default: '1280' },
    variant: {
      type: 'string',
      description: 'Variant: light, dark, gradient',
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
      const title = args.title || 'Build beautiful designs faster'
      const subtitle =
        args.subtitle ||
        'Create stunning interfaces with a modern design system that scales with your team.'
      const cta = args.cta || 'Get Started'
      const ctaSecondary = args['cta-secondary'] || 'Learn More'

      const themes: Record<string, { bg: string; text: string; sub: string; btn: string; btnText: string; btn2: string; btn2Text: string; btn2Stroke: string }> = {
        light: {
          bg: '#FFFFFF',
          text: '#0F172A',
          sub: '#475569',
          btn: '#3B82F6',
          btnText: '#FFFFFF',
          btn2: '#FFFFFF',
          btn2Text: '#0F172A',
          btn2Stroke: ' stroke="#E2E8F0" strokeWidth={1}'
        },
        dark: {
          bg: '#0F172A',
          text: '#F8FAFC',
          sub: '#94A3B8',
          btn: '#3B82F6',
          btnText: '#FFFFFF',
          btn2: '#1E293B',
          btn2Text: '#F8FAFC',
          btn2Stroke: ' stroke="#334155" strokeWidth={1}'
        },
        gradient: {
          bg: '#1E3A5F',
          text: '#FFFFFF',
          sub: '#CBD5E1',
          btn: '#FFFFFF',
          btnText: '#1E3A5F',
          btn2: 'transparent',
          btn2Text: '#FFFFFF',
          btn2Stroke: ' stroke="#FFFFFF66" strokeWidth={1}'
        }
      }

      const t = themes[args.variant || 'light'] || themes.light!

      const jsx = `
<Frame name="Hero Section" w={${w}} flex="col" items="center" py={80} px={24} bg="${t.bg}">
  <Frame flex="col" items="center" gap={24} maxW={800}>
    <Text size={56} weight={800} color="${t.text}" items="center">${title}</Text>
    <Text size={20} color="${t.sub}" items="center">${subtitle}</Text>
    <Frame flex="row" gap={12} pt={8}>
      <Frame bg="${t.btn}" rounded={10} px={24} py={14} flex="row" justify="center">
        <Text size={16} weight={600} color="${t.btnText}">${cta}</Text>
      </Frame>
      <Frame bg="${t.btn2}" rounded={10} px={24} py={14} flex="row" justify="center"${t.btn2Stroke}>
        <Text size={16} weight={600} color="${t.btn2Text}">${ctaSecondary}</Text>
      </Frame>
    </Frame>
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
      console.log(ok(`Hero section rendered: ${result.id}`))
    } catch (e) {
      handleError(e)
    }
  }
})

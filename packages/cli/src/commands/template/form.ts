import { defineCommand } from 'citty'

import { handleError } from '../../client.ts'
import { ok } from '../../format.ts'
import { renderFromString } from '../../render/index.ts'

export default defineCommand({
  meta: { description: 'Create a form template' },
  args: {
    title: { type: 'string', description: 'Form title', default: 'Sign In' },
    fields: {
      type: 'string',
      description: 'Comma-separated field names',
      default: 'Email,Password'
    },
    submit: { type: 'string', description: 'Submit button text', default: 'Sign In' },
    width: { type: 'string', description: 'Form width', default: '400' },
    variant: {
      type: 'string',
      description: 'Variant: default, card, minimal',
      default: 'card'
    },
    parent: { type: 'string', description: 'Parent node ID' },
    x: { type: 'string', description: 'X position' },
    y: { type: 'string', description: 'Y position' },
    json: { type: 'boolean', description: 'Output JSX instead of rendering' }
  },
  async run({ args }) {
    try {
      const w = Number(args.width)
      const title = args.title || 'Sign In'
      const fields = (args.fields || 'Email,Password').split(',').map((f) => f.trim())
      const submit = args.submit || 'Sign In'

      const isCard = args.variant === 'card' || args.variant === 'default'
      const isMinimal = args.variant === 'minimal'

      const fieldBlocks = fields
        .map((field) => {
          const isPassword = field.toLowerCase().includes('password')
          const placeholder = isPassword ? '••••••••' : `Enter your ${field.toLowerCase()}`
          return `<Frame flex="col" gap={6} w="fill">
          <Text size={14} weight={500} color="#334155">${field}</Text>
          <Frame w="fill" h={44} rounded={8} stroke="#D1D5DB" strokeWidth={1} bg="#FFFFFF" flex="row" items="center" px={12}>
            <Text size={14} color="#9CA3AF">${placeholder}</Text>
          </Frame>
        </Frame>`
        })
        .join('\n      ')

      const wrapperProps = isCard
        ? `bg="#FFFFFF" rounded={16} shadow="0px 4px 16px #00000010" p={32}`
        : isMinimal
          ? `p={0}`
          : `bg="#FFFFFF" rounded={16} stroke="#E2E8F0" strokeWidth={1} p={32}`

      const jsx = `
<Frame name="Form" w={${w}} flex="col" gap={24} ${wrapperProps}>
  <Frame flex="col" gap={4}>
    <Text size={24} weight={700} color="#0F172A">${title}</Text>
    <Text size={14} color="#64748B">Enter your details below</Text>
  </Frame>
  <Frame flex="col" gap={16} w="fill">
    ${fieldBlocks}
  </Frame>
  <Frame bg="#3B82F6" rounded={8} w="fill" h={44} flex="row" justify="center" items="center">
    <Text size={14} weight={600} color="#FFFFFF">${submit}</Text>
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
      console.log(ok(`Form rendered: ${result.id}`))
    } catch (e) {
      handleError(e)
    }
  }
})

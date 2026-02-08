import { bold, green, red, cyan } from 'agentfmt'
import { defineCommand } from 'citty'
import { createTwoFilesPatch } from 'diff'
import * as ts from 'typescript'

import { sendCommand, handleError } from '../../client.ts'
import { installHint } from '../../format.ts'
import { nodeToJsx as nodeToJsxAst } from '../../jsx-generator.ts'

import type { FigmaNode, FormatOptions } from '../../types.ts'

async function formatCode(code: string, options: Partial<FormatOptions> = {}): Promise<string> {
  try {
    const oxfmt = await import('oxfmt')
    const result = await oxfmt.format('component.tsx', code, {
      semi: options.semi ?? false,
      singleQuote: options.singleQuote ?? true,
      tabWidth: options.tabWidth ?? 2,
      useTabs: options.useTabs ?? false,
      trailingComma: options.trailingComma ?? 'es5'
    } as FormatOptions)
    return result.code
  } catch (e: unknown) {
    if ((e as NodeJS.ErrnoException).code === 'ERR_MODULE_NOT_FOUND') {
      console.error(`oxfmt is required for diff jsx. Install it:\n\n  ${installHint('oxfmt')}\n`)
      process.exit(1)
    }
    throw e
  }
}

async function nodeToJsx(id: string, formatOptions: Partial<FormatOptions> = {}): Promise<string> {
  const node = await sendCommand<FigmaNode>('get-node-tree', { id })
  if (!node) throw new Error('Node not found')

  const jsx = nodeToJsxAst(node)
  if (!jsx) return ''

  const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed })
  const sourceFile = ts.createSourceFile(
    'temp.tsx',
    '',
    ts.ScriptTarget.Latest,
    false,
    ts.ScriptKind.TSX
  )
  const code = printer.printNode(ts.EmitHint.Unspecified, jsx, sourceFile)

  return formatCode(code, formatOptions)
}

export default defineCommand({
  meta: { description: 'Show JSX diff between two nodes' },
  args: {
    from: { type: 'positional', description: 'Source node ID', required: true },
    to: { type: 'positional', description: 'Target node ID', required: true },
    context: { type: 'string', description: 'Lines of context (default: 3)', default: '3' },
    semi: { type: 'boolean', description: 'Add semicolons (default: false)' },
    'single-quote': { type: 'boolean', description: 'Use single quotes (default: true)' },
    'tab-width': { type: 'string', description: 'Spaces per indent (default: 2)' },
    tabs: { type: 'boolean', description: 'Use tabs instead of spaces' },
    'trailing-comma': {
      type: 'string',
      description: 'Trailing commas: none, es5, all (default: es5)'
    }
  },
  async run({ args }) {
    try {
      const formatOptions: Partial<FormatOptions> = {
        semi: args.semi,
        singleQuote: args['single-quote'] !== false,
        tabWidth: args['tab-width'] ? Number(args['tab-width']) : undefined,
        useTabs: args.tabs,
        trailingComma: args['trailing-comma'] as FormatOptions['trailingComma']
      }

      // Sequential to avoid CDP connection issues
      const fromJsx = await nodeToJsx(args.from, formatOptions)
      const toJsx = await nodeToJsx(args.to, formatOptions)

      if (fromJsx === toJsx) {
        console.log('No differences')
        return
      }

      const patch = createTwoFilesPatch(args.from, args.to, fromJsx, toJsx, 'source', 'target', {
        context: Number(args.context)
      })

      // Colorize output
      const lines = patch.split('\n')
      for (const line of lines) {
        if (line.startsWith('+++') || line.startsWith('---')) {
          console.log(bold(line))
        } else if (line.startsWith('+')) {
          console.log(green(line))
        } else if (line.startsWith('-')) {
          console.log(red(line))
        } else if (line.startsWith('@@')) {
          console.log(cyan(line))
        } else {
          console.log(line)
        }
      }
    } catch (e) {
      handleError(e)
    }
  }
})

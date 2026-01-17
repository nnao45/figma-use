import { defineCommand } from 'citty'
import { sendCommand, printResult, handleError } from '../client.ts'

export default defineCommand({
  meta: { description: 'Set text properties (line height, spacing, alignment, etc)' },
  args: {
    id: { type: 'string', description: 'Text node ID', required: true },
    lineHeight: { type: 'string', description: 'Line height (number or "auto")' },
    letterSpacing: { type: 'string', description: 'Letter spacing in px' },
    textAlign: { type: 'string', description: 'Horizontal: LEFT, CENTER, RIGHT, JUSTIFIED' },
    verticalAlign: { type: 'string', description: 'Vertical: TOP, CENTER, BOTTOM' },
    autoResize: { type: 'string', description: 'Auto resize: NONE, WIDTH_AND_HEIGHT, HEIGHT, TRUNCATE' },
    maxLines: { type: 'string', description: 'Max lines (for truncation)' },
    paragraphSpacing: { type: 'string', description: 'Spacing between paragraphs' },
    paragraphIndent: { type: 'string', description: 'First line indent' }
  },
  async run({ args }) {
    try {
      printResult(await sendCommand('set-text-properties', {
        id: args.id,
        lineHeight: args.lineHeight === 'auto' ? 'auto' : (args.lineHeight ? Number(args.lineHeight) : undefined),
        letterSpacing: args.letterSpacing ? Number(args.letterSpacing) : undefined,
        textAlign: args.textAlign,
        verticalAlign: args.verticalAlign,
        autoResize: args.autoResize,
        maxLines: args.maxLines ? Number(args.maxLines) : undefined,
        paragraphSpacing: args.paragraphSpacing ? Number(args.paragraphSpacing) : undefined,
        paragraphIndent: args.paragraphIndent ? Number(args.paragraphIndent) : undefined
      }))
    } catch (e) { handleError(e) }
  }
})

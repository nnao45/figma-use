import { defineCommand } from 'citty'
import node from './node.ts'
import selection from './selection.ts'
import screenshot from './screenshot.ts'

export default defineCommand({
  meta: { description: 'Export images' },
  subCommands: {
    node,
    selection,
    screenshot
  }
})

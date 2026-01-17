import { defineCommand } from 'citty'
import union from './union.ts'
import subtract from './subtract.ts'
import intersect from './intersect.ts'
import exclude from './exclude.ts'

export default defineCommand({
  meta: { description: 'Boolean operations' },
  subCommands: {
    union,
    subtract,
    intersect,
    exclude
  }
})

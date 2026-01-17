import { defineCommand } from 'citty'
import list from './list.ts'
import set from './set.ts'

export default defineCommand({
  meta: { description: 'Page operations' },
  subCommands: {
    list,
    set
  }
})

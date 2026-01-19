import { defineCommand } from 'citty'
import info from './info.ts'
import select from './select.ts'
import list from './list.ts'

export default defineCommand({
  meta: { description: 'File operations ' },
  subCommands: {
    info,
    list,
    select
  }
})

import { defineCommand } from 'citty'

import add from './add.ts'
import list from './list.ts'
import remove from './remove.ts'
import navigate from './navigate.ts'
import overlay from './overlay.ts'

export default defineCommand({
  meta: { description: 'Interaction operations' },
  subCommands: {
    add,
    list,
    remove,
    navigate,
    overlay
  }
})

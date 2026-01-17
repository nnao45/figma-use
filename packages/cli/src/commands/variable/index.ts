import { defineCommand } from 'citty'
import list from './list.ts'
import get from './get.ts'
import create from './create.ts'
import set from './set.ts'
import deleteCmd from './delete.ts'
import bind from './bind.ts'

export default defineCommand({
  meta: { description: 'Variable operations' },
  subCommands: {
    list,
    get,
    create,
    set,
    delete: deleteCmd,
    bind
  }
})

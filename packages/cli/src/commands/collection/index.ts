import { defineCommand } from 'citty'
import list from './list.ts'
import get from './get.ts'
import create from './create.ts'
import deleteCmd from './delete.ts'

export default defineCommand({
  meta: { description: 'Variable collection operations' },
  subCommands: {
    list,
    get,
    create,
    delete: deleteCmd
  }
})

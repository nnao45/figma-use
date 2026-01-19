import { defineCommand } from 'citty'
import create from './create.ts'
import get from './get.ts'
import set from './set.ts'
import list from './list.ts'

export default defineCommand({
  meta: { description: 'Connector operations' },
  subCommands: {
    create,
    get,
    set,
    list
  }
})

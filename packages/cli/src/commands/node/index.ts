import { defineCommand } from 'citty'
import get from './get.ts'
import children from './children.ts'
import deleteCmd from './delete.ts'
import clone from './clone.ts'
import rename from './rename.ts'
import move from './move.ts'
import resize from './resize.ts'
import setParent from './set-parent.ts'

export default defineCommand({
  meta: { description: 'Node operations' },
  subCommands: {
    get,
    children,
    delete: deleteCmd,
    clone,
    rename,
    move,
    resize,
    'set-parent': setParent
  }
})

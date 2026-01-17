import { defineCommand } from 'citty'
import create from './create.ts'
import ungroup from './ungroup.ts'
import flatten from './flatten.ts'

export default defineCommand({
  meta: { description: 'Group operations' },
  subCommands: {
    create,
    ungroup,
    flatten
  }
})

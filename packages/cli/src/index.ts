import { defineCommand, runMain } from 'citty'
import * as commands from './commands/index.ts'

const main = defineCommand({
  meta: {
    name: 'figma-use',
    description: 'Control Figma from the command line',
    version: '0.2.0'
  },
  subCommands: commands
})

runMain(main)

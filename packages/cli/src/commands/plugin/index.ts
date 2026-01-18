import { defineCommand } from 'citty'
import install from './install.ts'
import list from './list.ts'

export default defineCommand({
  meta: { description: 'Manage Figma plugins' },
  subCommands: {
    install,
    list,
    uninstall: defineCommand({
      meta: { description: 'Uninstall the Figma Use plugin' },
      args: {
        force: { type: 'boolean', description: 'Force uninstall even if Figma is running' }
      },
      async run({ args }) {
        await install.run?.({ args: { uninstall: true, path: false, force: args.force } } as any)
      }
    }),
    path: defineCommand({
      meta: { description: 'Show plugin manifest path' },
      async run() {
        await install.run?.({ args: { path: true, uninstall: false, force: false } } as any)
      }
    })
  }
})

import { defineCommand } from 'citty'

export default defineCommand({
  meta: { description: 'Generate design foundations (palette, type scale, spacing)' },
  subCommands: {
    palette: () => import('./palette.ts').then((m) => m.default),
    typescale: () => import('./typescale.ts').then((m) => m.default),
    spacing: () => import('./spacing.ts').then((m) => m.default)
  }
})

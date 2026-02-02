import { defineCommand } from 'citty'

export default defineCommand({
  meta: { description: 'Render ready-made UI pattern templates' },
  subCommands: {
    card: () => import('./card.ts').then((m) => m.default),
    hero: () => import('./hero.ts').then((m) => m.default),
    navbar: () => import('./navbar.ts').then((m) => m.default),
    form: () => import('./form.ts').then((m) => m.default),
    footer: () => import('./footer.ts').then((m) => m.default)
  }
})

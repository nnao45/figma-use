import { defineCommand } from 'citty'

import importIcons from './import.ts'
import search from './search.ts'
import sets from './sets.ts'

export default defineCommand({
  meta: {
    description:
      'Search, browse, and import icons from 150+ icon sets (Lucide, Material Design, etc.)'
  },
  subCommands: {
    search,
    sets,
    import: importIcons
  }
})

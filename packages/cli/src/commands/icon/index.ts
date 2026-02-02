import { defineCommand } from 'citty'

import search from './search.ts'
import sets from './sets.ts'
import importIcons from './import.ts'

export default defineCommand({
  meta: { description: 'Search, browse, and import icons from 150+ icon sets (Lucide, Material Design, etc.)' },
  subCommands: {
    search,
    sets,
    import: importIcons
  }
})

import { defineCommand } from 'citty'
import pages from './pages.ts'
import components from './components.ts'
import styles from './styles.ts'

export default defineCommand({
  meta: { description: 'Get document info' },
  subCommands: {
    pages,
    components,
    styles
  }
})

import { defineCommand } from 'citty'

import pie from './pie.ts'
import donut from './donut.ts'
import bar from './bar.ts'
import line from './line.ts'
import area from './area.ts'
import radar from './radar.ts'
import scatter from './scatter.ts'
import bubble from './bubble.ts'

export default defineCommand({
  meta: { description: 'Create charts using d3.js' },
  subCommands: { pie, donut, bar, line, area, radar, scatter, bubble }
})

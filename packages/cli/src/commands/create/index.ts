import { defineCommand } from 'citty'

import arrow from './arrow.ts'
import chart from './chart/index.ts'
import component from './component.ts'
import ellipse from './ellipse.ts'
import frame from './frame.ts'
import icon from './icon.ts'
import image from './image.ts'
import instance from './instance.ts'
import line from './line.ts'
import page from './page.ts'
import polygon from './polygon.ts'
import rect from './rect.ts'
import section from './section.ts'
import slice from './slice.ts'
import star from './star.ts'
import text from './text.ts'
import vector from './vector.ts'

export default defineCommand({
  meta: { description: 'Create nodes' },
  subCommands: {
    rect,
    ellipse,
    line,
    arrow,
    polygon,
    star,
    vector,
    frame,
    text,
    image,
    component,
    instance,
    section,
    page,
    slice,
    icon,
    chart
  }
})

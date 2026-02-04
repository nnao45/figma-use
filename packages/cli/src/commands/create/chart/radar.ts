import { defineCommand } from 'citty'

import { sendCommand, printResult, handleError } from '../../../client.ts'
import { getD3, getJSDOM, parseData, parseColors, type DataPoint } from './d3-utils.ts'
import { createLegendSvg, calculateLegendWidth, calculateLegendHeight } from './legend.ts'

export default defineCommand({
  meta: { description: 'Create a radar chart' },
  args: {
    data: { type: 'string', description: 'Data (label:value,...)', required: true },
    x: { type: 'string', description: 'X coordinate', default: '0' },
    y: { type: 'string', description: 'Y coordinate', default: '0' },
    size: { type: 'string', description: 'Size (width/height)', default: '250' },
    color: { type: 'string', description: 'Fill color (hex)', default: '#3B82F6' },
    opacity: { type: 'string', description: 'Fill opacity (0-1)', default: '0.3' },
    levels: { type: 'string', description: 'Number of concentric levels', default: '5' },
    'max-value': { type: 'string', description: 'Maximum value (auto if not set)' },
    legend: { type: 'boolean', description: 'Show legend' },
    parent: { type: 'string', description: 'Parent node ID' },
    json: { type: 'boolean', description: 'Output as JSON' }
  },
  async run({ args }) {
    try {
      const d3 = await getD3()
      const JSDOM = await getJSDOM()

      const data = parseData(args.data)
      const colors = parseColors(args.color)
      const fillColor = colors[0]!
      const size = Number(args.size)
      const fillOpacity = Number(args.opacity)
      const levels = Number(args.levels)
      const maxValue = args['max-value'] ? Number(args['max-value']) : Math.max(...data.map(d => d.value))

      // Create DOM for d3
      const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>')
      const document = dom.window.document

      // Calculate dimensions with legend
      const legendWidth = args.legend ? calculateLegendWidth(data) : 0
      const legendHeight = args.legend ? calculateLegendHeight(data) : 0
      const totalWidth = size + (args.legend ? legendWidth + 20 : 0)
      const totalHeight = Math.max(size, args.legend ? legendHeight + 20 : size)

      const svg = d3.select(document.body)
        .append('svg')
        .attr('width', totalWidth)
        .attr('height', totalHeight)
        .attr('viewBox', `0 0 ${totalWidth} ${totalHeight}`)

      const centerX = size / 2
      const centerY = size / 2
      const radius = size / 2 - 40 // Leave space for labels

      const g = svg.append('g')
        .attr('transform', `translate(${centerX}, ${centerY})`)

      const angleSlice = (Math.PI * 2) / data.length

      // Draw concentric level polygons
      for (let level = 1; level <= levels; level++) {
        const levelRadius = (radius / levels) * level
        const levelPoints = data.map((_, i) => {
          const angle = angleSlice * i - Math.PI / 2
          return [
            levelRadius * Math.cos(angle),
            levelRadius * Math.sin(angle)
          ]
        })

        g.append('polygon')
          .attr('points', levelPoints.map(p => p.join(',')).join(' '))
          .attr('fill', 'none')
          .attr('stroke', '#E5E7EB')
          .attr('stroke-width', 1)
      }

      // Draw axis lines
      data.forEach((_, i) => {
        const angle = angleSlice * i - Math.PI / 2
        g.append('line')
          .attr('x1', 0)
          .attr('y1', 0)
          .attr('x2', radius * Math.cos(angle))
          .attr('y2', radius * Math.sin(angle))
          .attr('stroke', '#E5E7EB')
          .attr('stroke-width', 1)
      })

      // Draw axis labels
      data.forEach((d, i) => {
        const angle = angleSlice * i - Math.PI / 2
        const labelRadius = radius + 15
        const x = labelRadius * Math.cos(angle)
        const y = labelRadius * Math.sin(angle)

        g.append('text')
          .attr('x', x)
          .attr('y', y)
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'middle')
          .attr('font-family', 'system-ui, sans-serif')
          .attr('font-size', '11')
          .attr('fill', '#374151')
          .text(d.label)
      })

      // Calculate data polygon points
      const dataPoints = data.map((d, i) => {
        const angle = angleSlice * i - Math.PI / 2
        const r = (d.value / maxValue) * radius
        return [
          r * Math.cos(angle),
          r * Math.sin(angle)
        ]
      })

      // Draw data polygon
      g.append('polygon')
        .attr('points', dataPoints.map(p => p.join(',')).join(' '))
        .attr('fill', fillColor)
        .attr('fill-opacity', fillOpacity)
        .attr('stroke', fillColor)
        .attr('stroke-width', 2)

      // Draw data points
      dataPoints.forEach(([x, y]) => {
        g.append('circle')
          .attr('cx', x ?? 0)
          .attr('cy', y ?? 0)
          .attr('r', 4)
          .attr('fill', fillColor)
      })

      // Add legend if requested
      if (args.legend) {
        const legendX = size + 20
        const legendY = (totalHeight - legendHeight) / 2
        const legendSvg = createLegendSvg({ data, colors, x: legendX, y: legendY })
        svg.node()!.innerHTML += legendSvg
      }

      const svgString = document.body.innerHTML

      // Import to Figma
      const result = await sendCommand('import-svg', {
        svg: svgString,
        x: Number(args.x),
        y: Number(args.y),
        parentId: args.parent
      }) as { id: string }

      // Rename node
      await sendCommand('rename-node', { id: result.id, name: 'Radar Chart' })

      // Get final result
      const finalResult = await sendCommand('get-node-info', { id: result.id })
      printResult(finalResult, args.json, 'create')
    } catch (e) {
      handleError(e)
    }
  }
})

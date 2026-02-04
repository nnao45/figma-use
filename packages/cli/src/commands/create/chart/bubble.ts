import { defineCommand } from 'citty'

import { sendCommand, printResult, handleError } from '../../../client.ts'
import { getD3, getJSDOM, parseBubbleData, parseColors, type BubblePoint } from './d3-utils.ts'
import { createLegendSvg, calculateLegendWidth, calculateLegendHeight } from './legend.ts'

export default defineCommand({
  meta: { description: 'Create a bubble chart' },
  args: {
    data: { type: 'string', description: 'Data (x:y:size,...)', required: true },
    x: { type: 'string', description: 'X coordinate', default: '0' },
    y: { type: 'string', description: 'Y coordinate', default: '0' },
    width: { type: 'string', description: 'Chart width', default: '400' },
    height: { type: 'string', description: 'Chart height', default: '300' },
    color: { type: 'string', description: 'Bubble color (hex)', default: '#3B82F6' },
    opacity: { type: 'string', description: 'Bubble opacity (0-1)', default: '0.6' },
    'max-radius': { type: 'string', description: 'Max bubble radius', default: '40' },
    'x-label': { type: 'string', description: 'X axis label' },
    'y-label': { type: 'string', description: 'Y axis label' },
    legend: { type: 'boolean', description: 'Show legend' },
    parent: { type: 'string', description: 'Parent node ID' },
    json: { type: 'boolean', description: 'Output as JSON' }
  },
  async run({ args }) {
    try {
      const d3 = await getD3()
      const JSDOM = await getJSDOM()

      const data = parseBubbleData(args.data)
      const colors = parseColors(args.color)
      const width = Number(args.width)
      const height = Number(args.height)
      const opacity = Number(args.opacity)
      const maxRadius = Number(args['max-radius'])

      // Create DOM for d3
      const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>')
      const document = dom.window.document

      // Margins for axes
      const margin = { top: 20, right: 20, bottom: 50, left: 60 }
      const chartWidth = width - margin.left - margin.right
      const chartHeight = height - margin.top - margin.bottom

      const legendData = data.map(point => ({
        label: point.label ?? '',
        value: point.size
      }))

      // Calculate dimensions with legend
      const legendWidth = args.legend ? calculateLegendWidth(legendData) : 0
      const legendHeight = args.legend ? calculateLegendHeight(legendData) : 0
      const totalWidth = width + (args.legend ? legendWidth + 20 : 0)
      const totalHeight = Math.max(height, args.legend ? legendHeight + 20 : height)

      const svg = d3.select(document.body)
        .append('svg')
        .attr('width', totalWidth)
        .attr('height', totalHeight)
        .attr('viewBox', `0 0 ${totalWidth} ${totalHeight}`)

      const g = svg.append('g')
        .attr('transform', `translate(${margin.left}, ${margin.top})`)

      const xExtent = d3.extent(data, (d: BubblePoint) => d.x)
      const yExtent = d3.extent(data, (d: BubblePoint) => d.y)
      const sizeExtent = d3.extent(data, (d: BubblePoint) => d.size)
      const xDomain = normalizeDomain(xExtent)
      const yDomain = normalizeDomain(yExtent)
      const sizeDomain = normalizeDomain(sizeExtent)

      // Scales
      const xScale = d3.scaleLinear()
        .domain(xDomain)
        .nice()
        .range([0, chartWidth])

      const yScale = d3.scaleLinear()
        .domain(yDomain)
        .nice()
        .range([chartHeight, 0])

      const sizeScale = d3.scaleSqrt()
        .domain(sizeDomain)
        .range([4, maxRadius])

      // Bubbles
      g.selectAll('circle')
        .data(data)
        .join('circle')
        .attr('cx', (d: BubblePoint) => xScale(d.x))
        .attr('cy', (d: BubblePoint) => yScale(d.y))
        .attr('r', (d: BubblePoint) => sizeScale(d.size))
        .attr('fill', (_: BubblePoint, i: number) => colors[i % colors.length]!)
        .attr('fill-opacity', opacity)

      // X axis
      g.append('g')
        .attr('transform', `translate(0, ${chartHeight})`)
        .call(d3.axisBottom(xScale).ticks(5))
        .selectAll('text')
        .attr('font-family', 'system-ui, sans-serif')
        .attr('font-size', '11')

      // Y axis
      g.append('g')
        .call(d3.axisLeft(yScale).ticks(5))
        .selectAll('text')
        .attr('font-family', 'system-ui, sans-serif')
        .attr('font-size', '11')

      // Axis labels
      if (args['x-label']) {
        g.append('text')
          .attr('x', chartWidth / 2)
          .attr('y', chartHeight + 36)
          .attr('text-anchor', 'middle')
          .attr('font-family', 'system-ui, sans-serif')
          .attr('font-size', '12')
          .attr('fill', '#374151')
          .text(args['x-label'])
      }

      if (args['y-label']) {
        g.append('text')
          .attr('transform', 'rotate(-90)')
          .attr('x', -chartHeight / 2)
          .attr('y', -44)
          .attr('text-anchor', 'middle')
          .attr('font-family', 'system-ui, sans-serif')
          .attr('font-size', '12')
          .attr('fill', '#374151')
          .text(args['y-label'])
      }

      // Style axis lines
      svg.selectAll('.domain, .tick line')
        .attr('stroke', '#9CA3AF')

      // Add legend if requested
      if (args.legend) {
        const legendX = width + 20
        const legendY = (totalHeight - legendHeight) / 2
        const legendSvg = createLegendSvg({ data: legendData, colors, x: legendX, y: legendY })
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
      await sendCommand('rename-node', { id: result.id, name: 'Bubble Chart' })

      // Get final result
      const finalResult = await sendCommand('get-node-info', { id: result.id })
      printResult(finalResult, args.json, 'create')
    } catch (e) {
      handleError(e)
    }
  }
})

function normalizeDomain(extent: [number, number] | [number | undefined, number | undefined]): [number, number] {
  const min = extent[0] ?? 0
  const max = extent[1] ?? 0
  if (min === max) {
    const padding = min === 0 ? 1 : Math.abs(min) * 0.1
    return [min - padding, max + padding]
  }
  return [min, max]
}

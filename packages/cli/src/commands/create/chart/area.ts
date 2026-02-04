import { defineCommand } from 'citty'

import { sendCommand, printResult, handleError } from '../../../client.ts'
import { getD3, getJSDOM, parseData, parseColors, type DataPoint } from './d3-utils.ts'
import { createLegendSvg, calculateLegendWidth, calculateLegendHeight } from './legend.ts'

export default defineCommand({
  meta: { description: 'Create an area chart' },
  args: {
    data: { type: 'string', description: 'Data (label:value,...)', required: true },
    x: { type: 'string', description: 'X coordinate', default: '0' },
    y: { type: 'string', description: 'Y coordinate', default: '0' },
    width: { type: 'string', description: 'Chart width', default: '400' },
    height: { type: 'string', description: 'Chart height', default: '200' },
    color: { type: 'string', description: 'Area color (hex)', default: '#3B82F6' },
    opacity: { type: 'string', description: 'Fill opacity (0-1)', default: '0.3' },
    'show-line': { type: 'boolean', description: 'Show line on top', default: true },
    smooth: { type: 'boolean', description: 'Use smooth curves' },
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
      const areaColor = colors[0]!
      const width = Number(args.width)
      const height = Number(args.height)
      const fillOpacity = Number(args.opacity)

      // Create DOM for d3
      const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>')
      const document = dom.window.document

      // Margins for axes
      const margin = { top: 20, right: 20, bottom: 40, left: 50 }
      const chartWidth = width - margin.left - margin.right
      const chartHeight = height - margin.top - margin.bottom

      // Calculate dimensions with legend
      const legendWidth = args.legend ? calculateLegendWidth(data) : 0
      const legendHeight = args.legend ? calculateLegendHeight(data) : 0
      const totalWidth = width + (args.legend ? legendWidth + 20 : 0)
      const totalHeight = Math.max(height, args.legend ? legendHeight + 20 : height)

      const svg = d3.select(document.body)
        .append('svg')
        .attr('width', totalWidth)
        .attr('height', totalHeight)
        .attr('viewBox', `0 0 ${totalWidth} ${totalHeight}`)

      const g = svg.append('g')
        .attr('transform', `translate(${margin.left}, ${margin.top})`)

      // Scales
      const xScale = d3.scalePoint<string>()
        .domain(data.map(d => d.label))
        .range([0, chartWidth])
        .padding(0.5)

      const yScale = d3.scaleLinear()
        .domain([0, d3.max(data, (d: DataPoint) => d.value) ?? 0])
        .nice()
        .range([chartHeight, 0])

      // Area generator
      const areaGenerator = d3.area<DataPoint>()
        .x((d: DataPoint) => xScale(d.label) ?? 0)
        .y0(chartHeight)
        .y1((d: DataPoint) => yScale(d.value))

      // Line generator
      const lineGenerator = d3.line<DataPoint>()
        .x((d: DataPoint) => xScale(d.label) ?? 0)
        .y((d: DataPoint) => yScale(d.value))

      if (args.smooth) {
        areaGenerator.curve(d3.curveMonotoneX)
        lineGenerator.curve(d3.curveMonotoneX)
      }

      // Draw area
      g.append('path')
        .datum(data)
        .attr('fill', areaColor)
        .attr('fill-opacity', fillOpacity)
        .attr('d', areaGenerator)

      // Draw line on top
      if (args['show-line'] !== false) {
        g.append('path')
          .datum(data)
          .attr('fill', 'none')
          .attr('stroke', areaColor)
          .attr('stroke-width', 2)
          .attr('d', lineGenerator)
      }

      // X axis
      g.append('g')
        .attr('transform', `translate(0, ${chartHeight})`)
        .call(d3.axisBottom(xScale))
        .selectAll('text')
        .attr('font-family', 'system-ui, sans-serif')
        .attr('font-size', '11')

      // Y axis
      g.append('g')
        .call(d3.axisLeft(yScale).ticks(5))
        .selectAll('text')
        .attr('font-family', 'system-ui, sans-serif')
        .attr('font-size', '11')

      // Style axis lines
      svg.selectAll('.domain, .tick line')
        .attr('stroke', '#9CA3AF')

      // Add legend if requested
      if (args.legend) {
        const legendX = width + 20
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
      await sendCommand('rename-node', { id: result.id, name: 'Area Chart' })

      // Get final result
      const finalResult = await sendCommand('get-node-info', { id: result.id })
      printResult(finalResult, args.json, 'create')
    } catch (e) {
      handleError(e)
    }
  }
})

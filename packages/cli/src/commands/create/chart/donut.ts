import { defineCommand } from 'citty'

import { sendCommand, printResult, handleError } from '../../../client.ts'
import { getD3, getJSDOM, parseData, parseColors, type DataPoint } from './d3-utils.ts'
import { createLegendSvg, calculateLegendWidth, calculateLegendHeight } from './legend.ts'

export default defineCommand({
  meta: { description: 'Create a donut chart' },
  args: {
    data: { type: 'string', description: 'Data (label:value,...)', required: true },
    x: { type: 'string', description: 'X coordinate', default: '0' },
    y: { type: 'string', description: 'Y coordinate', default: '0' },
    size: { type: 'string', description: 'Size (width/height)', default: '200' },
    'inner-radius': { type: 'string', description: 'Inner radius ratio (0-1)', default: '0.6' },
    colors: { type: 'string', description: 'Colors (hex,...)' },
    legend: { type: 'boolean', description: 'Show legend' },
    parent: { type: 'string', description: 'Parent node ID' },
    json: { type: 'boolean', description: 'Output as JSON' }
  },
  async run({ args }) {
    try {
      const d3 = await getD3()
      const JSDOM = await getJSDOM()

      const data = parseData(args.data)
      const colors = parseColors(args.colors)
      const size = Number(args.size)
      const innerRadiusRatio = Number(args['inner-radius'])

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

      const g = svg.append('g')
        .attr('transform', `translate(${size / 2}, ${size / 2})`)

      const outerRadius = size / 2 - 10
      const innerRadius = outerRadius * innerRadiusRatio

      const pie = d3.pie<DataPoint>().value((d: DataPoint) => d.value).sort(null)
      const arc = d3.arc<d3.PieArcDatum<DataPoint>>()
        .innerRadius(innerRadius)
        .outerRadius(outerRadius)

      g.selectAll('path')
        .data(pie(data))
        .join('path')
        .attr('d', arc as never)
        .attr('fill', (_: d3.PieArcDatum<DataPoint>, i: number) => colors[i % colors.length]!)

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
      await sendCommand('rename-node', { id: result.id, name: 'Donut Chart' })

      // Get final result
      const finalResult = await sendCommand('get-node-info', { id: result.id })
      printResult(finalResult, args.json, 'create')
    } catch (e) {
      handleError(e)
    }
  }
})

import { defineCommand } from 'citty'
import { sendCommand, handleError } from '../../client.ts'
import type { FigmaNode } from '../../types.ts'

function formatColor(fill: { type: string; color?: string; opacity?: number }): string {
  if (fill.type === 'SOLID' && fill.color) {
    const alpha = fill.opacity !== undefined && fill.opacity < 1 
      ? Math.round(fill.opacity * 255).toString(16).padStart(2, '0').toUpperCase()
      : ''
    return fill.color + alpha
  }
  return fill.type.toLowerCase()
}

function formatNode(node: FigmaNode, depth: number, index: number, options: { 
  showHidden: boolean
  maxDepth: number
  interactive: boolean
}): string[] {
  const lines: string[] = []
  
  if (!options.showHidden && node.visible === false) return lines
  if (options.maxDepth !== -1 && depth > options.maxDepth) return lines
  
  const indent = '  '.repeat(depth)
  const type = node.type.toLowerCase()
  
  const isInteractive = ['frame', 'component', 'instance', 'text', 'rectangle', 'ellipse', 'vector', 'group', 'boolean_operation'].includes(node.type.toLowerCase().replace('_', ''))
  
  if (options.interactive && !isInteractive && depth > 0) {
    if (node.children) {
      for (let i = 0; i < node.children.length; i++) {
        const child = node.children[i]
        if (child) lines.push(...formatNode(child, depth, i, options))
      }
    }
    return lines
  }
  
  let line = `${indent}[${index}] ${type} "${node.name}" (${node.id})`
  
  const props: string[] = []
  
  if (node.width !== undefined && node.height !== undefined) {
    const x = node.x !== undefined ? Math.round(node.x) : 0
    const y = node.y !== undefined ? Math.round(node.y) : 0
    props.push(`${Math.round(node.width)}×${Math.round(node.height)} at (${x}, ${y})`)
  }
  
  if (node.fills?.length) {
    const solidFill = node.fills.find(f => f.type === 'SOLID')
    if (solidFill) {
      props.push(`fill: ${formatColor(solidFill)}`)
    }
  }
  
  if (node.strokes?.length && node.strokeWeight) {
    const solidStroke = node.strokes.find(s => s.type === 'SOLID')
    if (solidStroke?.color) {
      props.push(`stroke: ${solidStroke.color} ${node.strokeWeight}px`)
    }
  }
  
  if (node.cornerRadius) {
    props.push(`radius: ${node.cornerRadius}`)
  }
  
  if (node.layoutMode && node.layoutMode !== 'NONE') {
    const layout = node.layoutMode === 'HORIZONTAL' ? 'row' : 'col'
    const gap = node.itemSpacing ? ` gap=${node.itemSpacing}` : ''
    props.push(`layout: ${layout}${gap}`)
  }
  
  if (node.characters) {
    const text = node.characters.length > 40 
      ? node.characters.slice(0, 40) + '…' 
      : node.characters
    props.push(`"${text.replace(/\n/g, '↵')}"`)
  }
  
  if (node.fontSize) {
    const font = node.fontFamily || ''
    const style = node.fontStyle && node.fontStyle !== 'Regular' ? ` ${node.fontStyle}` : ''
    props.push(`font: ${node.fontSize}px${font ? ` ${font}${style}` : ''}`)
  }
  
  if (node.opacity !== undefined && node.opacity < 1) {
    props.push(`opacity: ${Math.round(node.opacity * 100)}%`)
  }
  
  if (node.visible === false) props.push('hidden')
  if (node.locked) props.push('locked')
  
  if (props.length) {
    line += '\n' + indent + '    ' + props.join(' | ')
  }
  
  lines.push(line)
  
  if (node.children && (options.maxDepth === -1 || depth < options.maxDepth)) {
    for (let i = 0; i < node.children.length; i++) {
      const child = node.children[i]
      if (child) lines.push(...formatNode(child, depth + 1, i, options))
    }
  }
  
  return lines
}

const MAX_NODES = 500

export default defineCommand({
  meta: { description: 'Get node tree with properties' },
  args: {
    id: { type: 'positional', description: 'Node ID (default: current page)', required: false },
    depth: { type: 'string', description: 'Max depth (-1 for unlimited)', default: '-1' },
    interactive: { type: 'boolean', description: 'Only show interactive elements', alias: 'i' },
    hidden: { type: 'boolean', description: 'Include hidden nodes' },
    json: { type: 'boolean', description: 'Output as JSON' },
    force: { type: 'boolean', description: 'Skip node count limit', alias: 'f' }
  },
  async run({ args }) {
    try {
      const id = args.id || (await sendCommand('get-current-page', {}) as { id: string }).id
      const result = await sendCommand('get-node-tree', { id }) as FigmaNode
      
      const countNodes = (n: FigmaNode): number => 
        1 + (n.children?.reduce((sum, c) => sum + countNodes(c), 0) || 0)
      const total = countNodes(result)
      
      if (!args.force && total > MAX_NODES) {
        console.error(`✗ Tree has ${total} nodes (limit: ${MAX_NODES}). Use --depth to limit or --force to override.`)
        process.exit(1)
      }
      
      if (args.json) {
        console.log(JSON.stringify(result, null, 2))
        return
      }
      
      const options = {
        showHidden: args.hidden || false,
        maxDepth: Number(args.depth),
        interactive: args.interactive || false
      }
      
      const lines = formatNode(result, 0, 0, options)
      console.log(lines.join('\n'))
      console.log(`\n${total} nodes`)
      
    } catch (e) { handleError(e) }
  }
})

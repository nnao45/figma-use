// Lazy-loaded d3 and jsdom modules
let d3: typeof import('d3') | null = null
let JSDOM: typeof import('jsdom').JSDOM | null = null

export async function getD3(): Promise<typeof import('d3')> {
  if (!d3) {
    try {
      d3 = await import('d3')
    } catch {
      console.error('d3 is required for chart commands. Install it:\n\n  npm install d3\n')
      process.exit(1)
    }
  }
  return d3
}

export async function getJSDOM(): Promise<typeof import('jsdom').JSDOM> {
  if (!JSDOM) {
    try {
      const jsdom = await import('jsdom')
      JSDOM = jsdom.JSDOM
    } catch {
      console.error('jsdom is required for chart commands. Install it:\n\n  npm install jsdom\n')
      process.exit(1)
    }
  }
  return JSDOM
}

export interface DataPoint {
  label: string
  value: number
}

export interface ScatterPoint {
  x: number
  y: number
  label?: string
}

export interface BubblePoint {
  x: number
  y: number
  size: number
  label?: string
}

export function parseData(dataStr: string): DataPoint[] {
  // "開発:35,デザイン:25" → [{label: "開発", value: 35}, ...]
  return dataStr.split(',').map(item => {
    const [label, value] = item.split(':')
    return { label: label!.trim(), value: Number(value) }
  })
}

export function parseScatterData(dataStr: string): ScatterPoint[] {
  // "10:20,30:40" → [{x: 10, y: 20}, {x: 30, y: 40}]
  return dataStr.split(',').map((item, i) => {
    const parts = item.split(':').map(part => part.trim())
    if (parts.length === 2) {
      return { x: Number(parts[0]), y: Number(parts[1]), label: `Point ${i + 1}` }
    }
    // "A:10:20" → label:x:y
    return { label: parts[0], x: Number(parts[1]), y: Number(parts[2]) }
  })
}

export function parseBubbleData(dataStr: string): BubblePoint[] {
  // "10:20:30,40:50:20" → [{x: 10, y: 20, size: 30}, ...]
  return dataStr.split(',').map((item, i) => {
    const parts = item.split(':').map(part => part.trim())
    if (parts.length === 3) {
      return { x: Number(parts[0]), y: Number(parts[1]), size: Number(parts[2]), label: `Point ${i + 1}` }
    }
    // "A:10:20:30" → label:x:y:size
    return { label: parts[0], x: Number(parts[1]), y: Number(parts[2]), size: Number(parts[3]) }
  })
}

export function parseColors(colorsStr?: string): string[] {
  if (!colorsStr) {
    // Default color palette
    return ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16']
  }
  return colorsStr.split(',').map(c => c.trim())
}

export function createSvgDocument(): { document: Document; dom: InstanceType<typeof import('jsdom').JSDOM> } {
  // This will be called after getJSDOM() ensures JSDOM is loaded
  const dom = new JSDOM!('<!DOCTYPE html><html><body></body></html>')
  return { document: dom.window.document, dom }
}

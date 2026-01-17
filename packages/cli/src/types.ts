export interface FigmaNode {
  id: string
  name: string
  type: string
  x?: number
  y?: number
  width?: number
  height?: number
  fills?: FigmaPaint[]
  strokes?: FigmaPaint[]
  strokeWeight?: number
  cornerRadius?: number
  opacity?: number
  visible?: boolean
  locked?: boolean
  layoutMode?: string
  itemSpacing?: number
  children?: FigmaNode[]
  characters?: string
  fontSize?: number
  fontFamily?: string
  fontStyle?: string
  childCount?: number
}

export interface FigmaPaint {
  type: string
  color?: string
  opacity?: number
}

export interface FigmaViewport {
  center: { x: number; y: number }
  zoom: number
  bounds: { x: number; y: number; width: number; height: number }
}

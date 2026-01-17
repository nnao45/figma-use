/**
 * React Reconciler that outputs Figma NodeChanges directly
 * 
 * Renders React components directly to NodeChanges array
 * ready for multiplayer WebSocket transmission
 */

import Reconciler from 'react-reconciler'
import type { NodeChange } from '../multiplayer/codec.ts'
import { parseColor } from '../color.ts'

export interface RenderOptions {
  sessionID: number
  parentGUID: { sessionID: number; localID: number }
  startLocalID?: number
}

export interface RenderResult {
  nodeChanges: NodeChange[]
  nextLocalID: number
}

interface Instance {
  type: string
  props: Record<string, unknown>
  localID: number
  children: Instance[]
  textContent?: string
}

type Container = {
  options: RenderOptions
  localIDCounter: number
  children: Instance[]
}



function styleToNodeChange(
  type: string,
  props: Record<string, unknown>,
  localID: number,
  sessionID: number,
  parentGUID: { sessionID: number; localID: number },
  position: string,
  textContent?: string
): NodeChange {
  const style = (props.style || {}) as Record<string, unknown>
  const name = (props.name as string) || type
  
  const nodeChange: NodeChange = {
    guid: { sessionID, localID },
    phase: 'CREATED',
    parentIndex: { guid: parentGUID, position },
    type: mapType(type),
    name,
    visible: true,
    opacity: typeof style.opacity === 'number' ? style.opacity : 1,
  }
  
  // Size
  const width = style.width ?? props.width ?? (type === 'TEXT' ? undefined : 100)
  const height = style.height ?? props.height ?? (type === 'TEXT' ? undefined : 100)
  if (width !== undefined && height !== undefined) {
    nodeChange.size = { x: Number(width), y: Number(height) }
  }
  
  // Position (transform)
  const x = Number(style.x ?? props.x ?? 0)
  const y = Number(style.y ?? props.y ?? 0)
  nodeChange.transform = {
    m00: 1, m01: 0, m02: x,
    m10: 0, m11: 1, m12: y,
  }
  
  // Background color → fill
  if (style.backgroundColor) {
    const color = parseColor(style.backgroundColor as string)
    nodeChange.fillPaints = [{
      type: 'SOLID',
      color: { r: color.r, g: color.g, b: color.b, a: color.a },
      opacity: color.a,
      visible: true,
    }]
  }
  
  // Border → stroke
  if (style.borderColor) {
    const color = parseColor(style.borderColor as string)
    nodeChange.strokePaints = [{
      type: 'SOLID',
      color: { r: color.r, g: color.g, b: color.b, a: color.a },
      opacity: color.a,
      visible: true,
    }]
    nodeChange.strokeWeight = Number(style.borderWidth ?? 1)
  }
  
  // Corner radius
  if (style.borderRadius !== undefined) {
    nodeChange.cornerRadius = Number(style.borderRadius)
  }
  if (style.borderTopLeftRadius !== undefined) {
    nodeChange.rectangleTopLeftCornerRadius = Number(style.borderTopLeftRadius)
    nodeChange.rectangleCornerRadiiIndependent = true
  }
  if (style.borderTopRightRadius !== undefined) {
    nodeChange.rectangleTopRightCornerRadius = Number(style.borderTopRightRadius)
    nodeChange.rectangleCornerRadiiIndependent = true
  }
  if (style.borderBottomLeftRadius !== undefined) {
    nodeChange.rectangleBottomLeftCornerRadius = Number(style.borderBottomLeftRadius)
    nodeChange.rectangleCornerRadiiIndependent = true
  }
  if (style.borderBottomRightRadius !== undefined) {
    nodeChange.rectangleBottomRightCornerRadius = Number(style.borderBottomRightRadius)
    nodeChange.rectangleCornerRadiiIndependent = true
  }
  
  // Auto-layout
  if (style.flexDirection) {
    nodeChange.stackMode = style.flexDirection === 'row' ? 'HORIZONTAL' : 'VERTICAL'
  }
  if (style.gap !== undefined) {
    nodeChange.stackSpacing = Number(style.gap)
  }
  if (style.padding !== undefined) {
    const p = Number(style.padding)
    nodeChange.stackPadding = p
    nodeChange.stackPaddingRight = p
    nodeChange.stackPaddingBottom = p
  }
  if (style.paddingTop !== undefined) nodeChange.stackPadding = Number(style.paddingTop)
  if (style.paddingRight !== undefined) nodeChange.stackPaddingRight = Number(style.paddingRight)
  if (style.paddingBottom !== undefined) nodeChange.stackPaddingBottom = Number(style.paddingBottom)
  if (style.paddingLeft !== undefined) nodeChange.stackPadding = Number(style.paddingLeft)
  
  // Alignment
  if (style.justifyContent) {
    const map: Record<string, string> = {
      'flex-start': 'MIN', 'center': 'CENTER', 'flex-end': 'MAX', 'space-between': 'SPACE_BETWEEN'
    }
    nodeChange.stackJustify = map[style.justifyContent as string] || 'MIN'
  }
  if (style.alignItems) {
    const map: Record<string, string> = {
      'flex-start': 'MIN', 'center': 'CENTER', 'flex-end': 'MAX', 'stretch': 'STRETCH'
    }
    nodeChange.stackCounterAlign = map[style.alignItems as string] || 'MIN'
  }
  
  // Text-specific
  if (type.toLowerCase() === 'text' && textContent) {
    ;(nodeChange as any).characters = textContent
    if (style.fontSize) (nodeChange as any).fontSize = Number(style.fontSize)
    if (style.fontFamily || style.fontWeight) {
      const family = (style.fontFamily as string) || 'Inter'
      const fontStyle = mapFontWeight(style.fontWeight as string)
      ;(nodeChange as any).fontName = {
        family,
        style: fontStyle,
        postscript: `${family}-${fontStyle}`.replace(/\s+/g, ''),
      }
    }
    if (style.textAlign) {
      const map: Record<string, string> = { 'left': 'LEFT', 'center': 'CENTER', 'right': 'RIGHT' }
      ;(nodeChange as any).textAlignHorizontal = map[style.textAlign as string] || 'LEFT'
    }
    if (style.color) {
      const color = parseColor(style.color as string)
      nodeChange.fillPaints = [{
        type: 'SOLID',
        color: { r: color.r, g: color.g, b: color.b, a: color.a },
        opacity: color.a,
        visible: true,
      }]
    }
  }
  
  return nodeChange
}

function mapType(type: string): string {
  const map: Record<string, string> = {
    frame: 'FRAME',
    rectangle: 'RECTANGLE',
    ellipse: 'ELLIPSE',
    text: 'TEXT',
    line: 'LINE',
    star: 'STAR',
    polygon: 'REGULAR_POLYGON',
    vector: 'VECTOR',
    component: 'COMPONENT',
    instance: 'INSTANCE',
    group: 'GROUP',
    page: 'CANVAS',
  }
  return map[type.toLowerCase()] || 'FRAME'
}

function mapFontWeight(weight?: string): string {
  if (!weight) return 'Regular'
  const map: Record<string, string> = {
    'normal': 'Regular',
    'bold': 'Bold',
    '100': 'Thin',
    '200': 'Extra Light',
    '300': 'Light',
    '400': 'Regular',
    '500': 'Medium',
    '600': 'Semi Bold',
    '700': 'Bold',
    '800': 'Extra Bold',
    '900': 'Black',
  }
  return map[weight] || 'Regular'
}

function collectNodeChanges(
  instance: Instance,
  sessionID: number,
  parentGUID: { sessionID: number; localID: number },
  position: string,
  result: NodeChange[]
): void {
  const nodeChange = styleToNodeChange(
    instance.type,
    instance.props,
    instance.localID,
    sessionID,
    parentGUID,
    position,
    instance.textContent
  )
  result.push(nodeChange)
  
  const thisGUID = { sessionID, localID: instance.localID }
  instance.children.forEach((child, i) => {
    const childPosition = String.fromCharCode(33 + (i % 90))
    collectNodeChanges(child, sessionID, thisGUID, childPosition, result)
  })
}

const createHostConfig = (container: Container): Reconciler.HostConfig<
  string, Record<string, unknown>, Container, Instance, Instance,
  unknown, unknown, Instance, {}, true, unknown, unknown, unknown
> => ({
  supportsMutation: true,
  supportsPersistence: false,
  supportsHydration: false,

  createInstance(type, props): Instance {
    const { children, ...rest } = props
    return {
      type,
      props: rest,
      localID: container.localIDCounter++,
      children: [],
    }
  },

  createTextInstance(text): Instance {
    return {
      type: '__text__',
      props: {},
      localID: -1,
      children: [],
      textContent: text,
    }
  },

  appendInitialChild(parent, child) {
    if (child.type === '__text__') {
      parent.textContent = (parent.textContent || '') + child.textContent
    } else {
      parent.children.push(child)
    }
  },

  appendChild(parent, child) {
    if (child.type === '__text__') {
      parent.textContent = (parent.textContent || '') + child.textContent
    } else {
      parent.children.push(child)
    }
  },

  appendChildToContainer(cont, child) {
    if (child.type !== '__text__') {
      cont.children.push(child)
    }
  },

  removeChild(parent, child) {
    const index = parent.children.indexOf(child)
    if (index !== -1) parent.children.splice(index, 1)
  },

  removeChildFromContainer(cont, child) {
    const index = cont.children.indexOf(child)
    if (index !== -1) cont.children.splice(index, 1)
  },

  insertBefore(parent, child, beforeChild) {
    if (child.type === '__text__') return
    const index = parent.children.indexOf(beforeChild)
    if (index !== -1) {
      parent.children.splice(index, 0, child)
    } else {
      parent.children.push(child)
    }
  },

  insertInContainerBefore(cont, child, beforeChild) {
    if (child.type === '__text__') return
    const index = cont.children.indexOf(beforeChild)
    if (index !== -1) {
      cont.children.splice(index, 0, child)
    } else {
      cont.children.push(child)
    }
  },

  prepareForCommit: () => null,
  resetAfterCommit: () => {},
  clearContainer: (cont) => { cont.children = [] },
  
  getRootHostContext: () => ({}),
  getChildHostContext: () => ({}),
  shouldSetTextContent: () => false,
  finalizeInitialChildren: () => false,
  prepareUpdate: () => true,
  
  commitUpdate(instance, _payload, _type, _oldProps, newProps) {
    const { children, ...rest } = newProps
    instance.props = rest
  },
  
  commitTextUpdate(textInstance, _oldText, newText) {
    textInstance.textContent = newText
  },

  getPublicInstance: (instance) => instance,
  preparePortalMount: () => {},
  scheduleTimeout: setTimeout,
  cancelTimeout: clearTimeout,
  noTimeout: -1,
  isPrimaryRenderer: true,
  getCurrentEventPriority: () => 16,
  getInstanceFromNode: () => null,
  beforeActiveInstanceBlur: () => {},
  afterActiveInstanceBlur: () => {},
  prepareScopeUpdate: () => {},
  getInstanceFromScope: () => null,
  detachDeletedInstance: () => {},
})

/**
 * Render a React element directly to NodeChanges
 */
export function renderToNodeChanges(
  element: React.ReactElement,
  options: RenderOptions
): RenderResult {
  const container: Container = {
    options,
    localIDCounter: options.startLocalID ?? 1,
    children: [],
  }
  
  const hostConfig = createHostConfig(container)
  const reconciler = Reconciler(hostConfig)
  
  const root = reconciler.createContainer(
    container, 0, null, false, null, '', () => {}, null
  )
  
  reconciler.updateContainer(element, root, null, () => {})
  reconciler.flushSync(() => {})
  
  const nodeChanges: NodeChange[] = []
  container.children.forEach((child, i) => {
    const position = String.fromCharCode(33 + (i % 90))
    collectNodeChanges(child, options.sessionID, options.parentGUID, position, nodeChanges)
  })
  
  return {
    nodeChanges,
    nextLocalID: container.localIDCounter,
  }
}

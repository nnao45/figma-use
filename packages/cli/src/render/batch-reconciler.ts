/**
 * React Reconciler that outputs batch commands for Figma Plugin API
 * 
 * Instead of generating Kiwi-encoded NodeChanges for multiplayer,
 * this generates an array of commands to execute via `batch` command.
 */

import Reconciler from 'react-reconciler'
import { parseColor } from '../color.ts'
import { isVariable, resolveVariable } from './vars.ts'
import { normalizeStyle, type StyleProps } from './shorthands.ts'
import { getIconData } from './icon.ts'

interface BatchCommand {
  command: string
  args: Record<string, unknown>
}

interface HostContext {
  commands: BatchCommand[]
  refCounter: number
}

interface FiberNode {
  ref: string
  type: string
  props: Record<string, unknown>
  children: FiberNode[]
}

let currentContext: HostContext | null = null

function generateRef(ctx: HostContext): string {
  return `__ref_${ctx.refCounter++}`
}

function parseColorValue(color: string): string {
  if (isVariable(color)) {
    return color // Keep var:Name format, plugin handles it
  }
  const parsed = parseColor(color)
  const r = Math.round(parsed.r * 255).toString(16).padStart(2, '0')
  const g = Math.round(parsed.g * 255).toString(16).padStart(2, '0')
  const b = Math.round(parsed.b * 255).toString(16).padStart(2, '0')
  return `#${r}${g}${b}`.toUpperCase()
}

function styleToCommandArgs(style: StyleProps, type: string): Record<string, unknown> {
  const normalized = normalizeStyle(style)
  const args: Record<string, unknown> = {}

  // Position and size
  if (normalized.x !== undefined) args.x = normalized.x
  if (normalized.y !== undefined) args.y = normalized.y
  if (normalized.width !== undefined) args.width = normalized.width
  if (normalized.height !== undefined) args.height = normalized.height

  // Colors
  if (normalized.backgroundColor) {
    args.fill = parseColorValue(normalized.backgroundColor)
  }
  if (normalized.color && type === 'TEXT') {
    args.fill = parseColorValue(normalized.color)
  }
  if (normalized.stroke) {
    args.stroke = parseColorValue(normalized.stroke)
  }
  if (normalized.strokeWidth !== undefined) {
    args.strokeWeight = normalized.strokeWidth
  }

  // Border radius
  if (normalized.borderRadius !== undefined) {
    args.radius = normalized.borderRadius
  }

  // Opacity
  if (normalized.opacity !== undefined) {
    args.opacity = normalized.opacity
  }

  // Auto-layout
  if (normalized.display === 'flex' || normalized.flexDirection) {
    const dir = normalized.flexDirection
    if (dir === 'row' || dir === 'row-reverse') {
      args.layoutMode = 'HORIZONTAL'
    } else if (dir === 'column' || dir === 'column-reverse') {
      args.layoutMode = 'VERTICAL'
    }
  }

  if (normalized.display === 'grid') {
    args.layoutMode = 'GRID' // Will be set via Plugin API
  }

  if (normalized.gap !== undefined) {
    args.itemSpacing = normalized.gap
  }

  // Padding
  const padding: Record<string, number> = {}
  if (normalized.paddingTop !== undefined) padding.top = normalized.paddingTop
  if (normalized.paddingRight !== undefined) padding.right = normalized.paddingRight
  if (normalized.paddingBottom !== undefined) padding.bottom = normalized.paddingBottom
  if (normalized.paddingLeft !== undefined) padding.left = normalized.paddingLeft
  if (Object.keys(padding).length > 0) {
    args.padding = {
      top: padding.top ?? 0,
      right: padding.right ?? 0,
      bottom: padding.bottom ?? 0,
      left: padding.left ?? 0
    }
  }

  // Text properties
  if (normalized.fontSize !== undefined) {
    args.fontSize = normalized.fontSize
  }
  if (normalized.fontFamily) {
    args.fontFamily = normalized.fontFamily
  }
  if (normalized.fontWeight) {
    // Map weight to style
    const weight = normalized.fontWeight
    if (weight === 700 || weight === 'bold') {
      args.fontStyle = 'Bold'
    } else if (weight === 500 || weight === 'medium') {
      args.fontStyle = 'Medium'
    } else if (weight === 600 || weight === 'semibold') {
      args.fontStyle = 'Semi Bold'
    } else {
      args.fontStyle = 'Regular'
    }
  }

  return args
}

function createInstance(
  type: string,
  props: Record<string, unknown>,
  ctx: HostContext,
  parentRef?: string
): FiberNode {
  const ref = generateRef(ctx)
  const style = (props.style || {}) as StyleProps
  const name = props.name as string | undefined

  let command: string
  let args: Record<string, unknown> = styleToCommandArgs(style, type)

  switch (type.toLowerCase()) {
    case 'frame':
      command = 'create-frame'
      args = {
        ...args,
        x: args.x ?? 0,
        y: args.y ?? 0,
        width: args.width ?? 100,
        height: args.height ?? 100
      }
      break

    case 'rectangle':
    case 'rect':
      command = 'create-rectangle'
      args = {
        ...args,
        x: args.x ?? 0,
        y: args.y ?? 0,
        width: args.width ?? 100,
        height: args.height ?? 100
      }
      break

    case 'ellipse':
      command = 'create-ellipse'
      args = {
        ...args,
        x: args.x ?? 0,
        y: args.y ?? 0,
        width: args.width ?? 100,
        height: args.height ?? 100
      }
      break

    case 'text':
      command = 'create-text'
      args = {
        ...args,
        x: args.x ?? 0,
        y: args.y ?? 0,
        text: '', // Will be set from children
        fontFamily: args.fontFamily || 'Inter',
        fontStyle: args.fontStyle || 'Regular'
      }
      break

    case 'line':
      command = 'create-line'
      args = {
        ...args,
        x: args.x ?? 0,
        y: args.y ?? 0,
        length: args.width ?? 100
      }
      break

    case 'icon':
      // Icons are handled specially - will be imported via SVG
      command = 'create-frame' // Placeholder, replaced later
      args = { x: 0, y: 0, width: 24, height: 24 }
      break

    default:
      command = 'create-frame'
      args = { x: 0, y: 0, width: 100, height: 100 }
  }

  if (name) args.name = name
  args.ref = ref
  if (parentRef) args.parentRef = parentRef

  ctx.commands.push({ command, args })

  return { ref, type, props, children: [] }
}

function appendChildToParent(parent: FiberNode, child: FiberNode, ctx: HostContext) {
  parent.children.push(child)
  
  // Update parentRef in child's command
  const childCmd = ctx.commands.find(c => c.args.ref === child.ref)
  if (childCmd) {
    childCmd.args.parentRef = parent.ref
  }
}

function handleTextContent(instance: FiberNode, text: string, ctx: HostContext) {
  if (instance.type.toLowerCase() === 'text') {
    // Find the command and update text
    const cmd = ctx.commands.find(c => c.args.ref === instance.ref)
    if (cmd) {
      cmd.args.text = (cmd.args.text || '') + text
    }
  }
}

const hostConfig: Reconciler.HostConfig<
  string,            // Type
  Record<string, unknown>, // Props
  HostContext,       // Container
  FiberNode,         // Instance
  FiberNode,         // TextInstance
  unknown,           // SuspenseInstance
  unknown,           // HydratableInstance
  FiberNode,         // PublicInstance
  HostContext,       // HostContext
  unknown,           // UpdatePayload
  unknown,           // ChildSet
  number,            // TimeoutHandle
  number             // NoTimeout
> = {
  supportsMutation: true,
  supportsPersistence: false,
  supportsHydration: false,

  isPrimaryRenderer: true,
  noTimeout: -1,

  createInstance(type, props, rootContainer, hostContext) {
    return createInstance(type, props, rootContainer)
  },

  createTextInstance(text, rootContainer) {
    // Text nodes are handled by parent Text element
    return { ref: '', type: '__text__', props: { text }, children: [] }
  },

  appendInitialChild(parentInstance, child) {
    if (!currentContext) return
    
    if (child.type === '__text__') {
      handleTextContent(parentInstance, child.props.text as string, currentContext)
    } else {
      appendChildToParent(parentInstance, child, currentContext)
    }
  },

  appendChild(parentInstance, child) {
    if (!currentContext) return
    
    if (child.type === '__text__') {
      handleTextContent(parentInstance, child.props.text as string, currentContext)
    } else {
      appendChildToParent(parentInstance, child, currentContext)
    }
  },

  appendChildToContainer(container, child) {
    // Root level - no parent ref needed
  },

  removeChild() {},
  removeChildFromContainer() {},
  insertBefore() {},
  insertInContainerBefore() {},

  finalizeInitialChildren() {
    return false
  },

  prepareUpdate() {
    return null
  },

  commitUpdate() {},
  commitTextUpdate() {},

  getRootHostContext() {
    return currentContext!
  },

  getChildHostContext(parentHostContext) {
    return parentHostContext
  },

  getPublicInstance(instance) {
    return instance
  },

  prepareForCommit() {
    return null
  },

  resetAfterCommit() {},

  preparePortalMount() {},

  scheduleTimeout: setTimeout,
  cancelTimeout: clearTimeout,

  getCurrentEventPriority() {
    return 16 // DiscreteEventPriority
  },

  getInstanceFromNode() {
    return null
  },

  beforeActiveInstanceBlur() {},
  afterActiveInstanceBlur() {},
  prepareScopeUpdate() {},
  getInstanceFromScope() {
    return null
  },

  detachDeletedInstance() {},

  shouldSetTextContent() {
    return false
  },

  clearContainer() {}
}

const reconciler = Reconciler(hostConfig)

export interface RenderResult {
  commands: BatchCommand[]
  rootRef: string
}

function topologicalSort(commands: BatchCommand[]): BatchCommand[] {
  // Build dependency graph: child depends on parent
  const refToCmd = new Map<string, BatchCommand>()
  for (const cmd of commands) {
    refToCmd.set(cmd.args.ref as string, cmd)
  }

  const sorted: BatchCommand[] = []
  const visited = new Set<string>()
  const visiting = new Set<string>()

  function visit(ref: string) {
    if (visited.has(ref)) return
    if (visiting.has(ref)) return // cycle, skip
    
    visiting.add(ref)
    
    const cmd = refToCmd.get(ref)
    if (cmd?.args.parentRef) {
      visit(cmd.args.parentRef as string)
    }
    
    visiting.delete(ref)
    visited.add(ref)
    if (cmd) sorted.push(cmd)
  }

  for (const cmd of commands) {
    visit(cmd.args.ref as string)
  }

  return sorted
}

export function renderToBatchCommands(
  element: React.ReactElement,
  options?: {
    parentId?: string
    x?: number
    y?: number
  }
): RenderResult {
  const context: HostContext = {
    commands: [],
    refCounter: 0
  }

  currentContext = context

  const container = reconciler.createContainer(
    context,
    0,   // LegacyRoot
    null,
    false,
    null,
    '',
    () => {},
    null
  )

  reconciler.updateContainer(element, container, null, () => {})

  // Sort commands: parents before children
  const sorted = topologicalSort(context.commands)

  // Find root (node without parentRef)
  const root = sorted.find(c => !c.args.parentRef)

  // Apply position offset to root
  if (root && (options?.x !== undefined || options?.y !== undefined)) {
    if (options?.x !== undefined) root.args.x = options.x
    if (options?.y !== undefined) root.args.y = options.y
  }

  // Set external parent if provided
  if (options?.parentId && root) {
    root.args.parentId = options.parentId
  }

  currentContext = null

  return {
    commands: sorted,
    rootRef: root?.args.ref as string || ''
  }
}

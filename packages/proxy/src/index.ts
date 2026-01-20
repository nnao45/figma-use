import { Elysia } from 'elysia'
import { consola } from 'consola'
import { z } from 'zod'
import * as React from 'react'
import type { JSONRPCRequest, JSONRPCResponse } from '@modelcontextprotocol/sdk/types.js'
import { getTools, getToolByName } from '../../mcp/src/index.ts'
import {
  getMultiplayerConnection,
  getConnectionStatus,
  type NodeChange
} from './multiplayer.ts'
import {
  transformJsxSnippet,
  renderToNodeChanges,
  resetRenderedComponents,
  collectIcons,
  preloadIcons,
  getPendingIcons,
  clearPendingIcons
} from '../../cli/src/render/index.ts'
import { getFileKey, getParentGUID } from '../../cli/src/client.ts'
import { writeFileSync, unlinkSync, existsSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'

const PORT = Number(process.env.PORT) || 38451
const MCP_VERSION = '2024-11-05'

const TIMEOUT_LIGHT = 10_000
const TIMEOUT_HEAVY = 120_000

const HEAVY_COMMANDS = new Set(['export-node', 'screenshot', 'export-selection', 'eval'])

interface PendingRequest {
  resolve: (value: unknown) => void
  reject: (error: Error) => void
  timeout: ReturnType<typeof setTimeout>
}

interface PluginConnection {
  send: (data: string) => void
  sessionId: string
  fileName: string
  ws: object // WebSocket reference for cleanup
}

const pendingRequests = new Map<string, PendingRequest>()
const pluginConnections = new Map<string, PluginConnection>() // sessionId -> connection
const pendingConnections = new Map<object, (data: string) => void>() // ws -> send (before registration)
let activeSessionId: string | null = null // Currently active file for CLI

function getActiveConnection(): PluginConnection | null {
  if (activeSessionId && pluginConnections.has(activeSessionId)) {
    return pluginConnections.get(activeSessionId)!
  }
  // Return first available connection
  const first = pluginConnections.values().next()
  if (!first.done) {
    activeSessionId = first.value.sessionId
    return first.value
  }
  return null
}

function getConnectionBySessionId(sessionId: string): PluginConnection | null {
  return pluginConnections.get(sessionId) || null
}

async function renderJsx(args: Record<string, unknown>): Promise<unknown> {
  const jsx = args.jsx as string
  const x = args.x ? Number(args.x) : undefined
  const y = args.y ? Number(args.y) : undefined
  const parentId = args.parent as string | undefined

  if (!jsx?.trim()) {
    throw new Error('jsx is required')
  }

  // Transform JSX to module code
  const code = transformJsxSnippet(jsx)

  // Write temp file for dynamic import
  const tempFile = join(tmpdir(), `.figma-render-mcp-${Date.now()}.js`)
  writeFileSync(tempFile, code)

  try {
    // Import and get component
    const module = await import(tempFile)
    let Component = module.default

    // If factory function, call with React
    if (typeof Component === 'function' && Component.length >= 1) {
      const { defineVars } = await import('../../cli/src/render/vars.ts')
      Component = Component(React, { defineVars })
    }

    if (!Component) {
      throw new Error('No default export found')
    }

    // Get file key and parent from DevTools
    const fileKey = await getFileKey()
    const parentGUID = parentId
      ? { sessionID: Number(parentId.split(':')[0]), localID: Number(parentId.split(':')[1]) }
      : await getParentGUID()

    const sessionID = parentGUID.sessionID || Date.now() % 1000000

    // Create element and collect icons
    const element = React.createElement(Component, {})
    const icons = collectIcons(element)
    if (icons.length > 0) {
      await preloadIcons(icons)
    }

    // Render to node changes
    resetRenderedComponents()
    const result = renderToNodeChanges(element, {
      sessionID,
      parentGUID,
      startLocalID: Date.now() % 1000000
    })

    // Apply x/y offset
    const rootNode = result.nodeChanges[0]
    if (rootNode?.transform) {
      if (x !== undefined) rootNode.transform.m02 = x
      if (y !== undefined) rootNode.transform.m12 = y
    }

    // Send via multiplayer
    const { client } = await getMultiplayerConnection(fileKey)
    await client.sendNodeChangesSync(result.nodeChanges, 15000)

    // Import pending icons via plugin
    const pendingIconsList = getPendingIcons()
    clearPendingIcons()

    for (const icon of pendingIconsList) {
      const iconParentId = `${icon.parentGUID.sessionID}:${icon.parentGUID.localID}`
      await executeCommand('import-svg', {
        svg: icon.svg,
        x: icon.x,
        y: icon.y,
        parentId: iconParentId,
        name: icon.name,
        noFill: true,
        insertIndex: icon.childIndex
      })
    }

    // Trigger layout
    if (rootNode) {
      const rootId = `${rootNode.guid.sessionID}:${rootNode.guid.localID}`
      try {
        await executeCommand('trigger-layout', { nodeId: rootId })
      } catch {
        // Plugin may not be connected
      }
    }

    // Return created node IDs
    return {
      count: result.nodeChanges.length,
      nodes: result.nodeChanges.map((nc) => ({
        id: `${nc.guid.sessionID}:${nc.guid.localID}`,
        name: nc.name
      }))
    }
  } finally {
    if (existsSync(tempFile)) {
      unlinkSync(tempFile)
    }
  }
}

async function executeCommand<T = unknown>(
  command: string,
  args?: unknown,
  timeoutMs?: number,
  sessionId?: string
): Promise<T> {
  const conn = sessionId ? getConnectionBySessionId(sessionId) : getActiveConnection()
  if (!conn) {
    throw new Error('Plugin not connected')
  }

  const id = crypto.randomUUID()
  const defaultTimeout = HEAVY_COMMANDS.has(command) ? TIMEOUT_HEAVY : TIMEOUT_LIGHT
  const timeoutDuration = timeoutMs ?? defaultTimeout

  const result = await new Promise<T>((resolve, reject) => {
    const timeout = setTimeout(() => {
      pendingRequests.delete(id)
      reject(new Error('Request timeout'))
    }, timeoutDuration)

    pendingRequests.set(id, { resolve: resolve as (value: unknown) => void, reject, timeout })
    conn.send(JSON.stringify({ id, command, args }))
  })

  return result
}

const mcpSessions = new Map<string, { initialized: boolean }>()

async function handleMcpRequest(req: JSONRPCRequest, _sessionId?: string): Promise<JSONRPCResponse> {
  const { id, method, params } = req

  try {
    switch (method) {
      case 'initialize': {
        const newSessionId = crypto.randomUUID()
        mcpSessions.set(newSessionId, { initialized: true })
        return {
          jsonrpc: '2.0',
          id,
          result: {
            protocolVersion: MCP_VERSION,
            serverInfo: { name: 'figma-use', version: '0.5.5' },
            capabilities: { tools: {} },
            instructions: 'Figma MCP Server. Node IDs: "sessionID:localID". Colors: hex #RRGGBB.',
            sessionId: newSessionId
          }
        }
      }

      case 'tools/list': {
        const tools = await getTools()
        return {
          jsonrpc: '2.0',
          id,
          result: {
            tools: tools.map((t) => ({
              name: t.name,
              description: t.description,
              inputSchema: t.inputSchema
            }))
          }
        }
      }

      case 'tools/call': {
        const { name, arguments: args } = params as {
          name: string
          arguments?: Record<string, unknown>
        }
        const tool = getToolByName(name)

        if (!tool) {
          return {
            jsonrpc: '2.0',
            id,
            error: { code: -32602, message: `Unknown tool: ${name}` }
          }
        }

        // Coerce string args to numbers where schema expects them
        const coercedArgs: Record<string, unknown> = {}
        if (args && tool.inputSchema.properties) {
          for (const [key, value] of Object.entries(args)) {
            const propSchema = tool.inputSchema.properties[key]
            if (propSchema?.type === 'string' && typeof value === 'string') {
              // Try to coerce numeric strings to numbers (CLI uses string type but plugin expects numbers)
              const parsed = z.coerce.number().safeParse(value)
              coercedArgs[key] = parsed.success ? parsed.data : value
            } else {
              coercedArgs[key] = value
            }
          }
        } else if (args) {
          Object.assign(coercedArgs, args)
        }

        try {
          let result: unknown

          if (tool.pluginCommand === '__status__') {
            result = { pluginConnected: pluginConnections.size > 0 }
          } else if (tool.pluginCommand === '__render__') {
            result = await renderJsx(coercedArgs)
          } else {
            result = await executeCommand(tool.pluginCommand, coercedArgs)
          }

          return {
            jsonrpc: '2.0',
            id,
            result: {
              content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
              isError: false
            }
          }
        } catch (e) {
          return {
            jsonrpc: '2.0',
            id,
            result: {
              content: [{ type: 'text', text: e instanceof Error ? e.message : String(e) }],
              isError: true
            }
          }
        }
      }

      case 'notifications/initialized':
      case 'ping':
        return { jsonrpc: '2.0', id, result: {} }

      default:
        return {
          jsonrpc: '2.0',
          id,
          error: { code: -32601, message: `Method not found: ${method}` }
        }
    }
  } catch (e) {
    return {
      jsonrpc: '2.0',
      id,
      error: { code: -32603, message: e instanceof Error ? e.message : 'Internal error' }
    }
  }
}

new Elysia()
  .ws('/plugin', {
    open(ws) {
      consola.info('Plugin connecting...')
      // Store pending connection until registration
      pendingConnections.set(ws, (data) => ws.send(data))
    },
    close(ws) {
      // Remove from pending
      pendingConnections.delete(ws)
      
      // Find and remove from registered connections by ws reference
      for (const [sessionId, conn] of pluginConnections.entries()) {
        if (conn.ws === ws) {
          pluginConnections.delete(sessionId)
          consola.warn(`Plugin disconnected: ${conn.fileName} (${sessionId})`)
          
          // Clear activeSessionId if this was the active connection
          if (activeSessionId === sessionId) {
            activeSessionId = null
          }
          return
        }
      }
      
      consola.warn('Plugin disconnected (unregistered)')
    },
    message(ws, message) {
      const msgStr = typeof message === 'string' ? message : JSON.stringify(message)
      const data = JSON.parse(msgStr) as { 
        type?: string
        id?: string
        result?: unknown
        error?: string
        sessionId?: string
        fileName?: string
      }
      
      // Handle registration
      if (data.type === 'register') {
        const sessionId = data.sessionId || `unknown-${Date.now()}`
        const fileName = data.fileName || 'Unknown'
        
        // Remove from pending
        pendingConnections.delete(ws)
        
        // Check if this sessionId already has a connection (reconnect)
        if (pluginConnections.has(sessionId)) {
          consola.info(`Plugin reconnected: ${fileName} (${sessionId})`)
        } else {
          consola.success(`Plugin registered: ${fileName} (${sessionId})`)
        }
        
        pluginConnections.set(sessionId, {
          send: (d) => ws.send(d),
          sessionId,
          fileName,
          ws
        })
        
        // Set as active if first connection
        if (!activeSessionId) {
          activeSessionId = sessionId
        }
        return
      }

      // Handle command response
      if (data.id) {
        const pending = pendingRequests.get(data.id)
        if (!pending) return

        clearTimeout(pending.timeout)
        pendingRequests.delete(data.id)

        if (data.error) {
          pending.reject(new Error(data.error))
        } else {
          pending.resolve(data.result)
        }
      }
    }
  })
  .post('/command', async ({ body }) => {
    const { command, args, timeout, sessionId } = body as { 
      command: string
      args?: unknown
      timeout?: number
      sessionId?: string 
    }
    consola.info(`${command}`, args || '')

    try {
      const result = await executeCommand(command, args, timeout, sessionId)
      return { result }
    } catch (e) {
      consola.error(`${command} failed:`, e instanceof Error ? e.message : e)
      return { error: e instanceof Error ? e.message : String(e) }
    }
  })
  .post('/batch', async ({ body }) => {
    const conn = getActiveConnection()
    if (!conn) {
      return { error: 'Plugin not connected' }
    }

    const { commands, timeout: customTimeout, sessionId } = body as {
      commands: Array<{ command: string; args?: unknown; parentRef?: string }>
      timeout?: number
      sessionId?: string
    }
    const id = crypto.randomUUID()

    consola.info(`batch: ${commands.length} commands`)

    const targetConn = sessionId ? getConnectionBySessionId(sessionId) : conn
    if (!targetConn) {
      return { error: `File not connected: ${sessionId}` }
    }

    try {
      const timeoutMs = customTimeout || TIMEOUT_HEAVY

      const result = await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          pendingRequests.delete(id)
          reject(new Error('Request timeout'))
        }, timeoutMs)

        pendingRequests.set(id, { resolve, reject, timeout })
        targetConn.send(JSON.stringify({ id, command: 'batch', args: { commands } }))
      })

      return { result }
    } catch (e) {
      consola.error('batch failed:', e instanceof Error ? e.message : e)
      return { error: e instanceof Error ? e.message : String(e) }
    }
  })
  .get('/status', () => {
    const connections = Array.from(pluginConnections.entries()).map(([sessionId, conn]) => ({
      sessionId,
      fileName: conn.fileName,
      active: sessionId === activeSessionId
    }))
    return {
      pluginConnected: pluginConnections.size > 0,
      activeFile: activeSessionId,
      connections,
      multiplayer: getConnectionStatus()
    }
  })
  .get('/files', () => {
    return Array.from(pluginConnections.entries()).map(([sessionId, conn]) => ({
      sessionId,
      fileName: conn.fileName,
      active: sessionId === activeSessionId
    }))
  })
  .post('/select-file', ({ body }) => {
    const { sessionId } = body as { sessionId: string }
    if (!pluginConnections.has(sessionId)) {
      return { error: `File not connected: ${sessionId}` }
    }
    activeSessionId = sessionId
    const conn = pluginConnections.get(sessionId)!
    consola.info(`Switched to: ${conn.fileName} (${sessionId})`)
    return { success: true, fileName: conn.fileName }
  })
  .post('/render', async ({ body }) => {
    const { fileKey, nodeChanges } = body as {
      fileKey: string
      nodeChanges: NodeChange[]
      parentGUID?: { sessionID: number; localID: number }
    }

    if (!fileKey) {
      return { error: 'fileKey is required' }
    }

    if (!nodeChanges || !Array.isArray(nodeChanges)) {
      return { error: 'nodeChanges array is required' }
    }

    for (const nc of nodeChanges) {
      if (!nc.guid?.sessionID || !nc.guid?.localID) {
        return { error: 'Each nodeChange must have guid.sessionID and guid.localID' }
      }
    }

    try {
      const { client, sessionID } = await getMultiplayerConnection(fileKey)

      consola.info(`render: ${nodeChanges.length} nodes to ${fileKey}`)

      try {
        await client.sendNodeChangesSync(nodeChanges, 15000)
      } catch (codecError) {
        const msg = codecError instanceof Error ? codecError.message : String(codecError)
        // Handle unsupported enum values gracefully
        if (msg.includes('Invalid value') && msg.includes('for enum')) {
          consola.error('Codec error:', msg)
          return { error: `Unsupported value in node properties: ${msg}` }
        }
        throw codecError
      }

      // Note: trigger-layout is now called from CLI after render completes
      // This ensures multiplayer nodes are visible to the plugin

      const ids = nodeChanges.map((nc) => ({
        id: `${nc.guid.sessionID}:${nc.guid.localID}`,
        name: nc.name
      }))

      return {
        result: {
          count: nodeChanges.length,
          sessionID,
          nodes: ids
        }
      }
    } catch (e) {
      consola.error('render failed:', e instanceof Error ? e.message : e)
      return { error: e instanceof Error ? e.message : String(e) }
    }
  })
  .post('/mcp', async ({ body, request }) => {
    const sessionId = request.headers.get('mcp-session-id') || undefined
    const req = body as JSONRPCRequest

    consola.info(`MCP: ${req.method}`, req.params ? JSON.stringify(req.params).slice(0, 100) : '')

    const response = await handleMcpRequest(req, sessionId)

    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (response.result && typeof response.result === 'object' && 'sessionId' in response.result) {
      headers['mcp-session-id'] = (response.result as any).sessionId
    }

    return new Response(JSON.stringify(response), { headers })
  })
  .listen(PORT)

consola.start(`Proxy server running on http://localhost:${PORT}`)
consola.info(`MCP endpoint: http://localhost:${PORT}/mcp`)

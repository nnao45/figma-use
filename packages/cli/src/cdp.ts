// Use native WebSocket (Node 21+, Bun) - no external dependency

interface CDPTarget {
  webSocketDebuggerUrl: string
  url: string
  type: string
}

interface PendingRequest {
  resolve: (value: unknown) => void
  reject: (error: Error) => void
  timer: ReturnType<typeof setTimeout>
}

let cachedWs: WebSocket | null = null
let cachedTarget: CDPTarget | null = null
let messageId = 0
let idleTimer: ReturnType<typeof setTimeout> | null = null
const IDLE_TIMEOUT = 100
const CONNECTION_TIMEOUT = 5000 // 5 seconds for initial connection
const MAX_RETRIES = 4

const pendingRequests = new Map<number, PendingRequest>()

async function withRetry<T>(
  fn: () => Promise<T>,
  retries = MAX_RETRIES,
  baseDelay = 1000
): Promise<T> {
  let lastError: Error | undefined
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn()
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e))
      if (attempt < retries) {
        const delay = baseDelay * Math.pow(2, attempt) // 1s, 2s, 4s
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }
  }
  throw lastError
}

async function getCDPTarget(): Promise<CDPTarget> {
  if (cachedTarget) return cachedTarget

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), CONNECTION_TIMEOUT)

  let resp: Response
  try {
    resp = await fetch('http://localhost:9222/json', { signal: controller.signal })
  } catch (e) {
    clearTimeout(timeoutId)
    if (e instanceof Error && e.name === 'AbortError') {
      throw new Error(
        'CDP connection timeout.\n' +
          'Make sure Figma is started with: open -a Figma --args --remote-debugging-port=9222'
      )
    }
    throw new Error(
      'Failed to connect to CDP.\n' +
        'Make sure Figma is started with: open -a Figma --args --remote-debugging-port=9222'
    )
  }
  clearTimeout(timeoutId)

  const targets = (await resp.json()) as CDPTarget[]

  const figmaTarget =
    targets.find(
      (t) =>
        t.type === 'page' &&
        (t.url.includes('figma.com/design') || t.url.includes('figma.com/file/'))
    ) || targets.find((t) => t.type === 'page' && t.url.includes('figma.com/board'))

  if (!figmaTarget) {
    throw new Error(
      'No Figma file open in browser.\n' +
        'Start Figma with: open -a Figma --args --remote-debugging-port=9222'
    )
  }

  cachedTarget = figmaTarget
  return figmaTarget
}

function handleMessage(event: MessageEvent): void {
  const msg = JSON.parse(event.data)
  if (typeof msg.id !== 'number') return

  const pending = pendingRequests.get(msg.id)
  if (!pending) return

  pendingRequests.delete(msg.id)
  clearTimeout(pending.timer)
  scheduleClose()

  if (msg.result?.exceptionDetails) {
    const err = msg.result.exceptionDetails
    pending.reject(new Error(err.exception?.description || err.text || 'CDP error'))
  } else {
    pending.resolve(msg.result?.result?.value)
  }
}

async function connectWebSocket(target: CDPTarget): Promise<WebSocket> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(target.webSocketDebuggerUrl)
    let connected = false

    const connectionTimer = setTimeout(() => {
      if (!connected) {
        ws.close()
        reject(new Error('WebSocket connection timeout'))
      }
    }, CONNECTION_TIMEOUT)

    ws.addEventListener('open', () => {
      connected = true
      clearTimeout(connectionTimer)
      cachedWs = ws
      ws.addEventListener('message', handleMessage)
      resolve(ws)
    })

    ws.addEventListener('error', () => {
      clearTimeout(connectionTimer)
      reject(new Error('WebSocket connection failed'))
    })

    ws.addEventListener('close', () => {
      clearTimeout(connectionTimer)
      for (const [id, pending] of pendingRequests) {
        clearTimeout(pending.timer)
        pending.reject(new Error('WebSocket closed'))
        pendingRequests.delete(id)
      }
      if (cachedWs === ws) {
        cachedWs = null
        cachedTarget = null
      }
    })
  })
}

async function getWebSocket(): Promise<WebSocket> {
  if (cachedWs?.readyState === WebSocket.OPEN) return cachedWs

  return withRetry(async () => {
    // Clear cached target on retry to force re-fetch
    cachedTarget = null
    const target = await getCDPTarget()
    return connectWebSocket(target)
  })
}

function scheduleClose(): void {
  if (pendingRequests.size > 0) return
  if (idleTimer) clearTimeout(idleTimer)
  idleTimer = setTimeout(() => {
    closeCDP()
  }, IDLE_TIMEOUT)
}

export async function cdpEval<T>(code: string, timeout = 30000): Promise<T> {
  if (idleTimer) {
    clearTimeout(idleTimer)
    idleTimer = null
  }

  const ws = await getWebSocket()
  const id = ++messageId

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      pendingRequests.delete(id)
      scheduleClose()
      reject(new Error('CDP timeout'))
    }, timeout)

    pendingRequests.set(id, {
      resolve: resolve as (value: unknown) => void,
      reject,
      timer
    })

    ws.send(
      JSON.stringify({
        id,
        method: 'Runtime.evaluate',
        params: {
          expression: code,
          awaitPromise: true,
          returnByValue: true
        }
      })
    )
  })
}

export function getFileKeyFromUrl(url: string): string {
  const match = url.match(/\/(file|design)\/([a-zA-Z0-9]+)/)
  if (!match?.[2]) throw new Error('Could not extract file key from URL')
  return match[2]
}

export async function getFileKey(): Promise<string> {
  const target = await getCDPTarget()
  return getFileKeyFromUrl(target.url)
}

export function closeCDP(): void {
  if (idleTimer) {
    clearTimeout(idleTimer)
    idleTimer = null
  }

  for (const [id, pending] of pendingRequests) {
    clearTimeout(pending.timer)
    pending.reject(new Error('CDP connection closed'))
    pendingRequests.delete(id)
  }

  if (cachedWs) {
    const ws = cachedWs
    cachedWs = null
    ws.close()
  }
  cachedTarget = null
}

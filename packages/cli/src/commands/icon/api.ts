import { fail } from '../../format.ts'

const ICONIFY_API = 'https://api.iconify.design'

export interface SearchResult {
  icons: string[]
  total: number
  limit: number
  start: number
  collections: Record<string, { name: string; total: number; author?: { name: string } }>
}

export interface CollectionInfo {
  name: string
  total: number
  author?: { name: string; url?: string }
  license?: { title: string }
  category?: string
  palette?: boolean
  samples?: string[]
}

export interface CollectionDetail {
  prefix: string
  title: string
  total: number
  uncategorized?: string[]
  categories?: Record<string, string[]>
}

/**
 * Fetch from Iconify API with detailed error messages for network failures
 */
export async function iconifyFetch<T>(path: string, description: string): Promise<T> {
  const url = `${ICONIFY_API}${path}`
  let res: Response

  try {
    res = await fetch(url)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes('ENOTFOUND') || msg.includes('getaddrinfo')) {
      throw new Error(
        `Cannot reach Iconify API (DNS resolution failed). Check your internet connection.`
      )
    }
    if (msg.includes('ECONNREFUSED')) {
      throw new Error(`Iconify API connection refused. The service may be temporarily unavailable.`)
    }
    if (msg.includes('ETIMEDOUT') || msg.includes('timeout')) {
      throw new Error(`Iconify API request timed out. Check your network connection or try again.`)
    }
    if (msg.includes('CERT') || msg.includes('SSL') || msg.includes('certificate')) {
      throw new Error(`Iconify API TLS/SSL error: ${msg}`)
    }
    throw new Error(`Failed to connect to Iconify API: ${msg}`)
  }

  if (!res.ok) {
    if (res.status === 404) {
      throw new Error(`${description}: not found (404)`)
    }
    if (res.status === 429) {
      throw new Error(`Iconify API rate limit exceeded. Wait a moment and try again.`)
    }
    if (res.status >= 500) {
      throw new Error(
        `Iconify API server error (${res.status}). The service may be temporarily unavailable.`
      )
    }
    throw new Error(`Iconify API error: HTTP ${res.status} for ${description}`)
  }

  return res.json() as Promise<T>
}

export async function searchIcons(
  query: string,
  options: { prefix?: string; limit?: number } = {}
): Promise<SearchResult> {
  const params = new URLSearchParams({ query, limit: String(options.limit ?? 32) })
  if (options.prefix) params.set('prefix', options.prefix)
  return iconifyFetch<SearchResult>(`/search?${params}`, `search "${query}"`)
}

export async function listCollections(): Promise<Record<string, CollectionInfo>> {
  return iconifyFetch<Record<string, CollectionInfo>>('/collections', 'list icon sets')
}

export async function getCollection(prefix: string): Promise<CollectionDetail> {
  return iconifyFetch<CollectionDetail>(
    `/collection?prefix=${prefix}&chars=false&aliases=false`,
    `icon set "${prefix}"`
  )
}

/**
 * Run async tasks with concurrency limit
 */
export async function pMap<T, R>(
  items: T[],
  fn: (item: T, index: number) => Promise<R>,
  concurrency: number
): Promise<R[]> {
  const results: R[] = new Array(items.length)
  let nextIndex = 0

  async function worker(): Promise<void> {
    while (nextIndex < items.length) {
      const i = nextIndex++
      results[i] = await fn(items[i], i)
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => worker())
  await Promise.all(workers)
  return results
}

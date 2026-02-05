import { describe, test, expect, mock, beforeEach, afterEach } from 'bun:test'

import {
  iconifyFetch,
  searchIcons,
  listCollections,
  getCollection,
  pMap
} from '../../src/commands/icon/api.ts'

// --- Mock data ---

const mockSearchResult = {
  icons: ['lucide:arrow-right', 'lucide:arrow-left', 'mdi:arrow-up'],
  total: 3,
  limit: 32,
  start: 0,
  collections: {
    lucide: { name: 'Lucide', total: 2, author: { name: 'Lucide Contributors' } },
    mdi: { name: 'Material Design Icons', total: 1, author: { name: 'Austin Andrews' } }
  }
}

const mockCollections = {
  lucide: {
    name: 'Lucide',
    total: 1500,
    author: { name: 'Lucide Contributors' },
    samples: ['home', 'star', 'heart']
  },
  mdi: {
    name: 'Material Design Icons',
    total: 7000,
    author: { name: 'Austin Andrews' },
    samples: ['home', 'account', 'star']
  }
}

const mockCollectionDetail = {
  prefix: 'lucide',
  title: 'Lucide',
  total: 1500,
  categories: {
    Arrows: ['arrow-right', 'arrow-left', 'arrow-up', 'arrow-down'],
    Media: ['play', 'pause', 'stop']
  },
  uncategorized: ['custom-icon']
}

// --- Tests ---

describe('icon api', () => {
  const originalFetch = globalThis.fetch

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  describe('iconifyFetch', () => {
    test('returns parsed JSON on success', async () => {
      globalThis.fetch = mock(() =>
        Promise.resolve(new Response(JSON.stringify({ ok: true }), { status: 200 }))
      ) as typeof fetch
      const result = await iconifyFetch('/test', 'test')
      expect(result).toEqual({ ok: true })
    })

    test('throws descriptive error on DNS failure', async () => {
      globalThis.fetch = mock(() =>
        Promise.reject(new Error('getaddrinfo ENOTFOUND api.iconify.design'))
      ) as typeof fetch
      await expect(iconifyFetch('/test', 'test')).rejects.toThrow('DNS resolution failed')
    })

    test('throws descriptive error on connection refused', async () => {
      globalThis.fetch = mock(() =>
        Promise.reject(new Error('connect ECONNREFUSED 127.0.0.1:443'))
      ) as typeof fetch
      await expect(iconifyFetch('/test', 'test')).rejects.toThrow('connection refused')
    })

    test('throws descriptive error on timeout', async () => {
      globalThis.fetch = mock(() => Promise.reject(new Error('ETIMEDOUT'))) as typeof fetch
      await expect(iconifyFetch('/test', 'test')).rejects.toThrow('timed out')
    })

    test('throws descriptive error on TLS error', async () => {
      globalThis.fetch = mock(() =>
        Promise.reject(new Error('unable to verify the first certificate'))
      ) as typeof fetch
      await expect(iconifyFetch('/test', 'test')).rejects.toThrow('TLS/SSL error')
    })

    test('throws on 404', async () => {
      globalThis.fetch = mock(() =>
        Promise.resolve(new Response('', { status: 404 }))
      ) as typeof fetch
      await expect(iconifyFetch('/test', 'icon set "foo"')).rejects.toThrow('not found (404)')
    })

    test('throws on 429 rate limit', async () => {
      globalThis.fetch = mock(() =>
        Promise.resolve(new Response('', { status: 429 }))
      ) as typeof fetch
      await expect(iconifyFetch('/test', 'test')).rejects.toThrow('rate limit exceeded')
    })

    test('throws on 500 server error', async () => {
      globalThis.fetch = mock(() =>
        Promise.resolve(new Response('', { status: 500 }))
      ) as typeof fetch
      await expect(iconifyFetch('/test', 'test')).rejects.toThrow('server error')
    })
  })

  describe('searchIcons', () => {
    test('returns search results', async () => {
      globalThis.fetch = mock(() =>
        Promise.resolve(new Response(JSON.stringify(mockSearchResult), { status: 200 }))
      ) as typeof fetch
      const result = await searchIcons('arrow')
      expect(result.icons).toHaveLength(3)
      expect(result.total).toBe(3)
      expect(result.collections.lucide.name).toBe('Lucide')
    })

    test('passes prefix parameter', async () => {
      globalThis.fetch = mock((url: string) => {
        expect(url).toContain('prefix=lucide')
        return Promise.resolve(new Response(JSON.stringify(mockSearchResult), { status: 200 }))
      }) as typeof fetch
      await searchIcons('arrow', { prefix: 'lucide' })
    })

    test('passes limit parameter', async () => {
      globalThis.fetch = mock((url: string) => {
        expect(url).toContain('limit=10')
        return Promise.resolve(new Response(JSON.stringify(mockSearchResult), { status: 200 }))
      }) as typeof fetch
      await searchIcons('arrow', { limit: 10 })
    })
  })

  describe('listCollections', () => {
    test('returns all collections', async () => {
      globalThis.fetch = mock(() =>
        Promise.resolve(new Response(JSON.stringify(mockCollections), { status: 200 }))
      ) as typeof fetch
      const result = await listCollections()
      expect(Object.keys(result)).toHaveLength(2)
      expect(result.lucide.name).toBe('Lucide')
      expect(result.mdi.total).toBe(7000)
    })
  })

  describe('getCollection', () => {
    test('returns collection detail with categories', async () => {
      globalThis.fetch = mock(() =>
        Promise.resolve(new Response(JSON.stringify(mockCollectionDetail), { status: 200 }))
      ) as typeof fetch
      const result = await getCollection('lucide')
      expect(result.title).toBe('Lucide')
      expect(result.categories!.Arrows).toHaveLength(4)
      expect(result.uncategorized).toHaveLength(1)
    })

    test('throws on invalid prefix', async () => {
      globalThis.fetch = mock(() =>
        Promise.resolve(new Response('', { status: 404 }))
      ) as typeof fetch
      await expect(getCollection('nonexistent')).rejects.toThrow('not found')
    })
  })
})

describe('pMap', () => {
  test('runs tasks with concurrency limit', async () => {
    let maxConcurrent = 0
    let currentConcurrent = 0

    const results = await pMap(
      [1, 2, 3, 4, 5, 6],
      async (item) => {
        currentConcurrent++
        if (currentConcurrent > maxConcurrent) maxConcurrent = currentConcurrent
        await new Promise((r) => setTimeout(r, 10))
        currentConcurrent--
        return item * 2
      },
      2
    )

    expect(results).toEqual([2, 4, 6, 8, 10, 12])
    expect(maxConcurrent).toBeLessThanOrEqual(2)
  })

  test('handles empty array', async () => {
    const results = await pMap([], async () => 1, 5)
    expect(results).toEqual([])
  })

  test('preserves order', async () => {
    const results = await pMap(
      [30, 10, 20],
      async (ms) => {
        await new Promise((r) => setTimeout(r, ms))
        return ms
      },
      3
    )
    expect(results).toEqual([30, 10, 20])
  })

  test('handles concurrency greater than items', async () => {
    const results = await pMap([1, 2], async (x) => x * 3, 10)
    expect(results).toEqual([3, 6])
  })
})

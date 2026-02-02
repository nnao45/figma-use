import { describe, test, expect } from 'bun:test'

import { retry, retryOrThrow, sleep } from '../../src/retry.ts'

describe('sleep', () => {
  test('resolves after delay', async () => {
    const start = Date.now()
    await sleep(50)
    const elapsed = Date.now() - start
    expect(elapsed).toBeGreaterThanOrEqual(40)
  })
})

describe('retry', () => {
  test('returns first truthy result', async () => {
    let calls = 0
    const result = await retry(async () => {
      calls++
      return calls >= 1 ? 'done' : null
    })
    expect(result).toBe('done')
    expect(calls).toBe(1)
  })

  test('retries until truthy result', async () => {
    let calls = 0
    const result = await retry(
      async () => {
        calls++
        return calls >= 3 ? 'found' : null
      },
      { maxAttempts: 5, delayMs: 1 }
    )
    expect(result).toBe('found')
    expect(calls).toBe(3)
  })

  test('returns null after max attempts', async () => {
    let calls = 0
    const result = await retry(
      async () => {
        calls++
        return null
      },
      { maxAttempts: 3, delayMs: 1 }
    )
    expect(result).toBeNull()
    expect(calls).toBe(3)
  })

  test('uses fixed backoff by default', async () => {
    const start = Date.now()
    await retry(async () => null, { maxAttempts: 3, delayMs: 20, backoff: 'fixed' })
    const elapsed = Date.now() - start
    // 2 delays of 20ms each (no delay after last attempt)
    expect(elapsed).toBeGreaterThanOrEqual(30)
  })

  test('uses linear backoff', async () => {
    const start = Date.now()
    await retry(async () => null, { maxAttempts: 3, delayMs: 10, backoff: 'linear' })
    const elapsed = Date.now() - start
    // delay(0)=10, delay(1)=20 => 30ms total
    expect(elapsed).toBeGreaterThanOrEqual(20)
  })

  test('uses exponential backoff', async () => {
    const start = Date.now()
    await retry(async () => null, { maxAttempts: 3, delayMs: 10, backoff: 'exponential' })
    const elapsed = Date.now() - start
    // delay(0)=10, delay(1)=20 => 30ms total
    expect(elapsed).toBeGreaterThanOrEqual(20)
  })

  test('treats undefined as falsy', async () => {
    const result = await retry(async () => undefined, { maxAttempts: 2, delayMs: 1 })
    expect(result).toBeNull()
  })
})

describe('retryOrThrow', () => {
  test('returns result when found', async () => {
    const result = await retryOrThrow(async () => 42, 'not found', { maxAttempts: 1 })
    expect(result).toBe(42)
  })

  test('throws with message when all attempts fail', async () => {
    await expect(
      retryOrThrow(async () => null, 'custom error', { maxAttempts: 2, delayMs: 1 })
    ).rejects.toThrow('custom error')
  })
})

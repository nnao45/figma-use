import { describe, test, expect } from 'bun:test'

import { getDefaultConfig, mergeWithDefaults } from '../../src/config.ts'

describe('getDefaultConfig', () => {
  test('returns default lint preset', () => {
    const config = getDefaultConfig()
    expect(config.lint?.preset).toBe('recommended')
  })

  test('returns default storybook config', () => {
    const config = getDefaultConfig()
    expect(config.storybook?.out).toBe('./stories')
    expect(config.storybook?.matchIcons).toBe(false)
    expect(config.storybook?.framework).toBe('react')
    expect(config.storybook?.iconThreshold).toBe(0.85)
  })

  test('returns default format config', () => {
    const config = getDefaultConfig()
    expect(config.format?.pretty).toBe(true)
    expect(config.format?.semi).toBe(false)
    expect(config.format?.singleQuote).toBe(true)
    expect(config.format?.tabWidth).toBe(2)
    expect(config.format?.trailingComma).toBe('none')
  })
})

describe('mergeWithDefaults', () => {
  test('uses defaults for empty config', () => {
    const result = mergeWithDefaults({})
    expect(result.lint.preset).toBe('recommended')
    expect(result.storybook.out).toBe('./stories')
    expect(result.format.semi).toBe(false)
  })

  test('overrides specific values', () => {
    const result = mergeWithDefaults({
      lint: { preset: 'strict' },
      format: { semi: true }
    })
    expect(result.lint.preset).toBe('strict')
    expect(result.format.semi).toBe(true)
    // Other defaults preserved
    expect(result.storybook.out).toBe('./stories')
    expect(result.format.singleQuote).toBe(true)
  })

  test('merges storybook config', () => {
    const result = mergeWithDefaults({
      storybook: { page: 'MyPage', matchIcons: true }
    })
    expect(result.storybook.page).toBe('MyPage')
    expect(result.storybook.matchIcons).toBe(true)
    expect(result.storybook.framework).toBe('react')
  })
})

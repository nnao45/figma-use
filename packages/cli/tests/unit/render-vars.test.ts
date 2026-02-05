import { describe, test, expect } from 'bun:test'

import {
  isVariable,
  defineVars,
  figmaVar,
  loadVariablesIntoRegistry,
  resolveVariable,
  isRegistryLoaded,
  getRegistrySize
} from '../../src/render/vars.ts'

const VAR_SYMBOL = Symbol.for('figma.variable')

describe('isVariable', () => {
  test('returns true for figma variable', () => {
    const v = { [VAR_SYMBOL]: true, name: 'test' }
    expect(isVariable(v)).toBe(true)
  })

  test('returns false for null', () => {
    expect(isVariable(null)).toBe(false)
  })

  test('returns false for non-object', () => {
    expect(isVariable('string')).toBe(false)
    expect(isVariable(42)).toBe(false)
  })

  test('returns false for object without symbol', () => {
    expect(isVariable({ name: 'test' })).toBe(false)
  })
})

describe('defineVars', () => {
  test('creates variables from string definitions', () => {
    const vars = defineVars({
      primary: 'Colors/Blue/500',
      accent: 'Colors/Red/500'
    })
    expect(isVariable(vars.primary)).toBe(true)
    expect(vars.primary.name).toBe('Colors/Blue/500')
    expect(vars.accent.name).toBe('Colors/Red/500')
  })

  test('creates variables from object definitions with values', () => {
    const vars = defineVars({
      primary: { name: 'Colors/Blue/500', value: '#3B82F6' }
    })
    expect(vars.primary.name).toBe('Colors/Blue/500')
    expect(vars.primary.value).toBe('#3B82F6')
  })

  test('string definitions have no value', () => {
    const vars = defineVars({ primary: 'Colors/Blue/500' })
    expect(vars.primary.value).toBeUndefined()
  })
})

describe('figmaVar', () => {
  test('creates variable with name', () => {
    const v = figmaVar('Colors/Gray/50')
    expect(isVariable(v)).toBe(true)
    expect(v.name).toBe('Colors/Gray/50')
    expect(v.value).toBeUndefined()
  })

  test('creates variable with name and value', () => {
    const v = figmaVar('Colors/Gray/50', '#F8FAFC')
    expect(v.name).toBe('Colors/Gray/50')
    expect(v.value).toBe('#F8FAFC')
  })
})

describe('variable registry', () => {
  test('loadVariablesIntoRegistry populates registry', () => {
    loadVariablesIntoRegistry([
      { id: 'VariableID:100:200', name: 'Colors/Primary' },
      { id: 'VariableID:100:201', name: 'Colors/Secondary' }
    ])
    expect(isRegistryLoaded()).toBe(true)
    expect(getRegistrySize()).toBe(2)
  })

  test('resolveVariable resolves by name', () => {
    loadVariablesIntoRegistry([{ id: 'VariableID:100:200', name: 'Colors/Primary' }])
    const v = figmaVar('Colors/Primary')
    const resolved = resolveVariable(v)
    expect(resolved.id).toBe('VariableID:100:200')
    expect(resolved.sessionID).toBe(100)
    expect(resolved.localID).toBe(200)
  })

  test('resolveVariable resolves ID format directly', () => {
    const v = figmaVar('VariableID:50:60')
    const resolved = resolveVariable(v)
    expect(resolved.id).toBe('VariableID:50:60')
    expect(resolved.sessionID).toBe(50)
    expect(resolved.localID).toBe(60)
  })

  test('resolveVariable resolves bare ID format', () => {
    const v = figmaVar('50:60')
    const resolved = resolveVariable(v)
    expect(resolved.id).toBe('VariableID:50:60')
    expect(resolved.sessionID).toBe(50)
    expect(resolved.localID).toBe(60)
  })

  test('resolveVariable throws for unknown name', () => {
    loadVariablesIntoRegistry([])
    const v = figmaVar('NonExistent/Var')
    expect(() => resolveVariable(v)).toThrow('not found')
  })

  test('resolveVariable caches resolution', () => {
    loadVariablesIntoRegistry([{ id: 'VariableID:10:20', name: 'Test/Var' }])
    const v = figmaVar('Test/Var')
    const first = resolveVariable(v)
    const second = resolveVariable(v)
    expect(first).toBe(second)
  })

  test('loadVariablesIntoRegistry clears previous entries', () => {
    loadVariablesIntoRegistry([{ id: 'VariableID:1:1', name: 'Old/Var' }])
    expect(getRegistrySize()).toBe(1)
    loadVariablesIntoRegistry([{ id: 'VariableID:2:2', name: 'New/Var' }])
    expect(getRegistrySize()).toBe(1)
    const v = figmaVar('Old/Var')
    expect(() => resolveVariable(v)).toThrow('not found')
  })
})

import { describe, test, expect, beforeAll } from 'bun:test'
import { run } from '../helpers.ts'

describe('variable', () => {
  let collectionId: string
  let variableId: string

  test('collection list returns collections', async () => {
    const collections = await run('collection list --json') as any[]
    expect(Array.isArray(collections)).toBe(true)
  })

  test('collection create creates new collection', async () => {
    const collection = await run('collection create "Test Collection" --json') as any
    collectionId = collection.id
    expect(collection.name).toBe('Test Collection')
    expect(collection.modes.length).toBeGreaterThan(0)
  })

  test('list returns variables', async () => {
    const variables = await run('variable list --json') as any[]
    expect(Array.isArray(variables)).toBe(true)
  })

  test('list filters by type', async () => {
    const variables = await run('variable list --type COLOR --json') as any[]
    expect(variables.every(v => v.type === 'COLOR')).toBe(true)
  })

  test('create creates new variable', async () => {
    if (!collectionId) {
      const collection = await run('collection create "Temp Collection" --json') as any
      collectionId = collection.id
    }
    const variable = await run(`variable create "Test Color" --collection "${collectionId}" --type COLOR --value "#FF0000" --json`) as any
    variableId = variable.id
    expect(variable.name).toBe('Test Color')
    expect(variable.type).toBe('COLOR')
  })

  test('get returns variable by id', async () => {
    if (!variableId) return
    const variable = await run(`variable get ${variableId} --json`) as any
    expect(variable.id).toBe(variableId)
  })

  test('delete removes variable', async () => {
    if (!variableId) return
    const result = await run(`variable delete ${variableId} --json`) as any
    expect(result.deleted).toBe(true)
  })

  test('collection delete removes collection', async () => {
    if (!collectionId) return
    const result = await run(`collection delete ${collectionId} --json`) as any
    expect(result.deleted).toBe(true)
  })
})

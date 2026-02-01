import { defineCommand } from 'citty'
import { readFileSync } from 'fs'

import { sendCommand, handleError } from '../../client.ts'
import { ok, fail } from '../../format.ts'
import { parseFigmaPatch } from './parse.ts'
import { serializeNode, deserializeNode, diffProps } from './serialize.ts'

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = []
  for await (const chunk of process.stdin) {
    chunks.push(chunk)
  }
  return Buffer.concat(chunks).toString('utf-8')
}

export default defineCommand({
  meta: { description: 'Apply a diff patch to Figma nodes' },
  args: {
    stdin: { type: 'boolean', description: 'Read patch from stdin' },
    file: { type: 'positional', description: 'Patch file path', required: false },
    'dry-run': { type: 'boolean', description: 'Show what would be changed without applying' },
    force: { type: 'boolean', description: 'Apply even if old values do not match' },
    json: { type: 'boolean', description: 'Output as JSON' }
  },
  async run({ args }) {
    try {
      let patchText: string

      if (args.stdin) {
        patchText = await readStdin()
      } else if (args.file) {
        patchText = readFileSync(args.file, 'utf-8')
      } else {
        console.error(fail('Provide a patch file or use --stdin'))
        process.exit(1)
      }

      const patches = parseFigmaPatch(patchText)

      if (patches.length === 0) {
        console.error(fail('No valid patches found'))
        process.exit(1)
      }

      const results: Array<{
        nodeId: string
        path: string
        status: 'applied' | 'skipped' | 'failed' | 'created' | 'deleted'
        error?: string
        changes?: Record<string, unknown>
      }> = []

      for (const patch of patches) {
        const { path, nodeId, isDelete, isCreate, oldContent, newContent } = patch

        // Handle delete
        if (isDelete && nodeId) {
          if (args['dry-run']) {
            results.push({ nodeId, path, status: 'deleted', changes: { action: 'DELETE' } })
            continue
          }

          try {
            await sendCommand('delete-node', { id: nodeId })
            results.push({ nodeId, path, status: 'deleted' })
          } catch (e) {
            results.push({ nodeId, path, status: 'failed', error: String(e) })
          }
          continue
        }

        // Handle create
        if (isCreate) {
          const newProps = deserializeNode(newContent)

          if (args['dry-run']) {
            results.push({
              nodeId: 'new',
              path,
              status: 'created',
              changes: newProps as unknown as Record<string, unknown>
            })
            continue
          }

          try {
            // Resolve parent from path: "/Parent/Child" → parent is "Parent"
            const pathParts = path.split('/').filter(Boolean)
            let parentId: string | undefined
            if (pathParts.length > 1) {
              const parentName = pathParts[pathParts.length - 2]
              if (parentName) {
                const found = (await sendCommand('find-by-name', {
                  name: parentName,
                  exact: true,
                  limit: 1
                })) as Array<{ id: string }>
                if (found && found.length > 0 && found[0]) {
                  parentId = found[0].id
                }
              }
            }

            const x = newProps.pos?.[0] ?? 0
            const y = newProps.pos?.[1] ?? 0
            const width = newProps.size?.[0] ?? 100
            const height = newProps.size?.[1] ?? 100
            const nodeName = pathParts[pathParts.length - 1]

            let createdNode: Record<string, unknown> | undefined

            switch (newProps.type) {
              case 'FRAME':
                createdNode = (await sendCommand('create-frame', {
                  x,
                  y,
                  width,
                  height,
                  name: nodeName,
                  parentId,
                  fill: newProps.fill,
                  stroke: newProps.stroke,
                  strokeWeight: newProps.strokeWeight,
                  radius: newProps.radius,
                  opacity: newProps.opacity
                })) as Record<string, unknown>
                break
              case 'RECTANGLE':
                createdNode = (await sendCommand('create-rectangle', {
                  x,
                  y,
                  width,
                  height,
                  name: nodeName,
                  parentId,
                  fill: newProps.fill,
                  stroke: newProps.stroke,
                  strokeWeight: newProps.strokeWeight,
                  radius: newProps.radius,
                  opacity: newProps.opacity
                })) as Record<string, unknown>
                break
              case 'ELLIPSE':
                createdNode = (await sendCommand('create-ellipse', {
                  x,
                  y,
                  width,
                  height,
                  name: nodeName,
                  parentId,
                  fill: newProps.fill,
                  stroke: newProps.stroke,
                  strokeWeight: newProps.strokeWeight,
                  opacity: newProps.opacity
                })) as Record<string, unknown>
                break
              case 'TEXT':
                createdNode = (await sendCommand('create-text', {
                  x,
                  y,
                  text: newProps.text ?? nodeName ?? 'Text',
                  fontSize: newProps.fontSize,
                  fontFamily: newProps.fontFamily,
                  fill: newProps.fill,
                  opacity: newProps.opacity,
                  name: nodeName,
                  parentId
                })) as Record<string, unknown>
                break
              case 'LINE':
                createdNode = (await sendCommand('create-line', {
                  x,
                  y,
                  length: width,
                  rotation: newProps.rotation,
                  name: nodeName,
                  parentId,
                  stroke: newProps.stroke,
                  strokeWeight: newProps.strokeWeight
                })) as Record<string, unknown>
                break
              case 'POLYGON':
                createdNode = (await sendCommand('create-polygon', {
                  x,
                  y,
                  size: Math.max(width, height),
                  name: nodeName,
                  parentId,
                  fill: newProps.fill,
                  stroke: newProps.stroke,
                  strokeWeight: newProps.strokeWeight
                })) as Record<string, unknown>
                break
              case 'STAR':
                createdNode = (await sendCommand('create-star', {
                  x,
                  y,
                  size: Math.max(width, height),
                  name: nodeName,
                  parentId,
                  fill: newProps.fill,
                  stroke: newProps.stroke,
                  strokeWeight: newProps.strokeWeight
                })) as Record<string, unknown>
                break
              case 'VECTOR':
                if (newProps.vectorPaths && newProps.vectorPaths.length > 0) {
                  createdNode = (await sendCommand('create-vector', {
                    x,
                    y,
                    path: newProps.vectorPaths[0],
                    name: nodeName,
                    parentId,
                    fill: newProps.fill,
                    stroke: newProps.stroke,
                    strokeWeight: newProps.strokeWeight
                  })) as Record<string, unknown>
                } else {
                  createdNode = (await sendCommand('create-rectangle', {
                    x,
                    y,
                    width,
                    height,
                    name: nodeName,
                    parentId,
                    fill: newProps.fill
                  })) as Record<string, unknown>
                }
                break
              case 'COMPONENT':
                createdNode = (await sendCommand('create-component', {
                  x,
                  y,
                  width,
                  height,
                  name: nodeName ?? 'Component',
                  parentId,
                  fill: newProps.fill
                })) as Record<string, unknown>
                break
              default:
                // Default: create a frame for unknown types
                createdNode = (await sendCommand('create-frame', {
                  x,
                  y,
                  width,
                  height,
                  name: nodeName,
                  parentId,
                  fill: newProps.fill
                })) as Record<string, unknown>
                break
            }

            const createdId =
              (createdNode?.id as string) ?? (createdNode?.nodeId as string) ?? 'new'

            // Apply additional properties that aren't covered by create commands
            if (createdId && createdId !== 'new') {
              if (newProps.visible === false) {
                await sendCommand('set-visibility', { id: createdId, visible: false })
              }
              if (newProps.locked === true) {
                await sendCommand('set-locked', { id: createdId, locked: true })
              }
              if (newProps.rotation && newProps.type !== 'LINE') {
                await sendCommand('set-rotation', { id: createdId, rotation: newProps.rotation })
              }
              if (newProps.blendMode) {
                await sendCommand('set-blend-mode', { id: createdId, mode: newProps.blendMode })
              }
            }

            results.push({
              nodeId: createdId,
              path,
              status: 'created',
              changes: newProps as unknown as Record<string, unknown>
            })
          } catch (e) {
            results.push({
              nodeId: 'new',
              path,
              status: 'failed',
              error: `CREATE failed: ${String(e)}`
            })
          }
          continue
        }

        // Handle modify
        if (!nodeId) {
          results.push({ nodeId: 'unknown', path, status: 'skipped', error: 'No node ID in patch' })
          continue
        }

        // Get current node state
        let currentNode: Record<string, unknown>
        try {
          currentNode = (await sendCommand('get-node-info', { id: nodeId })) as Record<
            string,
            unknown
          >
        } catch {
          results.push({ nodeId, path, status: 'failed', error: `Node not found: ${nodeId}` })
          continue
        }

        const currentSerialized = serializeNode(currentNode)
        const expectedOld = oldContent

        // Validate old content matches (unless --force)
        if (!args.force && currentSerialized !== expectedOld) {
          // Try line-by-line comparison for better error message
          const currentLines = currentSerialized.split('\n')
          const expectedLines = expectedOld.split('\n')
          const mismatches: string[] = []

          for (const expLine of expectedLines) {
            if (!currentLines.includes(expLine)) {
              mismatches.push(expLine)
            }
          }

          results.push({
            nodeId,
            path,
            status: 'failed',
            error: `Old value mismatch. Expected:\n${mismatches.join('\n')}\nActual:\n${currentSerialized}`
          })
          continue
        }

        // Calculate and apply changes
        const oldProps = deserializeNode(oldContent)
        const newProps = deserializeNode(newContent)
        const changes = diffProps(oldProps, newProps)

        if (Object.keys(changes).length === 0) {
          results.push({ nodeId, path, status: 'skipped', error: 'No changes detected' })
          continue
        }

        if (args['dry-run']) {
          results.push({
            nodeId,
            path,
            status: 'applied',
            changes: changes as Record<string, unknown>
          })
          continue
        }

        // Apply each change
        try {
          if (changes.fill) {
            await sendCommand('set-fill-color', { id: nodeId, color: changes.fill })
          }
          if (changes.stroke) {
            await sendCommand('set-stroke-color', {
              id: nodeId,
              color: changes.stroke,
              weight: changes.strokeWeight
            })
          }
          if (changes.opacity !== undefined) {
            await sendCommand('set-opacity', { id: nodeId, opacity: changes.opacity })
          }
          if (changes.radius !== undefined) {
            await sendCommand('set-radius', { id: nodeId, radius: changes.radius })
          }
          if (changes.size) {
            await sendCommand('resize-node', {
              id: nodeId,
              width: changes.size[0]!,
              height: changes.size[1]!
            })
          }
          if (changes.pos) {
            await sendCommand('move-node', { id: nodeId, x: changes.pos[0]!, y: changes.pos[1]! })
          }
          if (changes.text !== undefined) {
            await sendCommand('set-text-content', { id: nodeId, text: changes.text })
          }
          if (changes.visible !== undefined) {
            await sendCommand('set-visibility', { id: nodeId, visible: changes.visible })
          }
          if (changes.locked !== undefined) {
            await sendCommand('set-locked', { id: nodeId, locked: changes.locked })
          }

          results.push({
            nodeId,
            path,
            status: 'applied',
            changes: changes as Record<string, unknown>
          })
        } catch (e) {
          results.push({ nodeId, path, status: 'failed', error: String(e) })
        }
      }

      // Output
      if (args.json) {
        console.log(JSON.stringify(results, null, 2))
      } else {
        for (const r of results) {
          const icon =
            r.status === 'applied'
              ? '✓'
              : r.status === 'created'
                ? '+'
                : r.status === 'deleted'
                  ? '-'
                  : r.status === 'skipped'
                    ? '○'
                    : '✗'
          console.log(`${icon} ${r.path} #${r.nodeId}`)

          if (r.error) {
            console.log(`  ${r.error}`)
          }
          if (r.changes && args['dry-run']) {
            for (const [key, val] of Object.entries(r.changes)) {
              console.log(`  ${key}: ${JSON.stringify(val)}`)
            }
          }
        }

        const applied = results.filter(
          (r) => r.status === 'applied' || r.status === 'created' || r.status === 'deleted'
        ).length
        const failed = results.filter((r) => r.status === 'failed').length

        if (args['dry-run']) {
          console.log(`\n${applied} changes would be applied`)
        } else {
          console.log(
            `\n${ok(`${applied} applied`)}${failed > 0 ? `, ${fail(`${failed} failed`)}` : ''}`
          )
        }
      }
    } catch (e) {
      handleError(e)
    }
  }
})

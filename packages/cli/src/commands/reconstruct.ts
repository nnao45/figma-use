import { defineCommand } from 'citty'
import { existsSync, readFileSync } from 'fs'

import { sendCommand, handleError } from '../client.ts'
import { ok, fail } from '../format.ts'

/**
 * Reconstruct: AI-powered image-to-Figma workflow.
 *
 * Places a reference image in Figma and creates a working frame
 * for the AI agent to reconstruct the design into.
 *
 * Workflow:
 *   1. figma-use reconstruct ./screenshot.png
 *   2. AI analyzes the image (via vision) and the returned metadata
 *   3. AI uses `render` or `create` commands to build Figma nodes in the working frame
 */
export default defineCommand({
  meta: { description: 'Place reference image and create working frame for AI reconstruction' },
  args: {
    src: {
      type: 'positional',
      description: 'Image source: URL (https://...) or local file path',
      required: true
    },
    x: { type: 'string', description: 'X position', default: '0' },
    y: { type: 'string', description: 'Y position', default: '0' },
    width: { type: 'string', description: 'Override width (default: image native)' },
    height: { type: 'string', description: 'Override height (default: image native)' },
    name: { type: 'string', description: 'Working frame name', default: 'Reconstruction' },
    parent: { type: 'string', description: 'Parent node ID' },
    'ref-opacity': {
      type: 'string',
      description: 'Reference image opacity (0-1)',
      default: '0.3'
    },
    'no-ref': {
      type: 'boolean',
      description: 'Skip placing reference image (just create working frame)'
    },
    'include-data': {
      type: 'boolean',
      description: 'Include base64 image data in output (for AI vision analysis)'
    },
    json: { type: 'boolean', description: 'Output as JSON' }
  },
  async run({ args }) {
    try {
      let url: string | undefined
      let data: string | undefined

      if (args.src.startsWith('http://') || args.src.startsWith('https://')) {
        url = args.src
      } else if (args.src.startsWith('data:')) {
        const base64Start = args.src.indexOf(',')
        if (base64Start === -1) {
          console.error(fail('Invalid data URI'))
          process.exit(1)
        }
        data = args.src.slice(base64Start + 1)
      } else {
        if (!existsSync(args.src)) {
          console.error(fail(`File not found: ${args.src}`))
          process.exit(1)
        }
        const buffer = readFileSync(args.src)
        data = buffer.toString('base64')
      }

      const posX = Number(args.x)
      const posY = Number(args.y)
      const overrideWidth = args.width ? Number(args.width) : undefined
      const overrideHeight = args.height ? Number(args.height) : undefined

      // Step 1: Create the reference image to get its dimensions
      let refNodeId: string | undefined
      let imgWidth: number
      let imgHeight: number

      if (!args['no-ref']) {
        const refResult = (await sendCommand('create-image-node', {
          x: posX,
          y: posY,
          width: overrideWidth,
          height: overrideHeight,
          name: `${args.name} - Reference`,
          parentId: args.parent,
          url,
          data,
          scaleMode: 'FIT'
        })) as { id: string; width: number; height: number }

        refNodeId = refResult.id
        imgWidth = overrideWidth || refResult.width
        imgHeight = overrideHeight || refResult.height

        // Lock the reference and set opacity
        await sendCommand('set-locked', { id: refNodeId, locked: true })
        await sendCommand('set-opacity', {
          id: refNodeId,
          opacity: Number(args['ref-opacity'])
        })
      } else {
        imgWidth = overrideWidth || 1440
        imgHeight = overrideHeight || 900
      }

      // Step 2: Create the working frame on top
      const workFrame = (await sendCommand('create-frame', {
        x: posX,
        y: posY,
        width: imgWidth,
        height: imgHeight,
        name: args.name,
        parentId: args.parent
      })) as { id: string; name: string }

      // Make the working frame transparent so reference shows through
      await sendCommand('set-fill-color', { id: workFrame.id, color: 'transparent' })

      // Step 3: Zoom to the working area
      await sendCommand('set-viewport', {
        x: posX + imgWidth / 2,
        y: posY + imgHeight / 2,
        zoom: Math.min(1, 800 / Math.max(imgWidth, imgHeight))
      })

      // Step 4: Output result
      const result: Record<string, unknown> = {
        workingFrameId: workFrame.id,
        workingFrameName: workFrame.name,
        referenceImageId: refNodeId || null,
        width: imgWidth,
        height: imgHeight,
        position: { x: posX, y: posY }
      }

      if (args['include-data'] && data) {
        result.imageBase64 = data
      } else if (args['include-data'] && url) {
        result.imageUrl = url
      }

      if (args.json) {
        console.log(JSON.stringify(result, null, 2))
      } else {
        console.log(ok(`Working frame: ${workFrame.id} (${imgWidth}×${imgHeight})`))
        if (refNodeId) {
          console.log(`  Reference image: ${refNodeId} (opacity: ${args['ref-opacity']})`)
        }
        console.log(`  Position: (${posX}, ${posY})`)
        console.log()
        console.log('Next steps for AI agent:')
        console.log(`  1. Analyze the original image`)
        console.log(`  2. Use 'render --parent ${workFrame.id}' to build the design`)
        console.log(`  3. Or use 'create' commands with --parent ${workFrame.id}`)
      }
    } catch (e) {
      handleError(e)
    }
  }
})

import { defineCommand } from 'citty'
import { writeFileSync } from 'fs'

import { sendCommand, handleError } from '../../client.ts'
import {
  createRoot,
  createFontFace,
  createFontFaceSrc,
  googleFontsUrl,
  googleFontsImport
} from '../../css-builder.ts'

interface FontInfo {
  family: string
  styles: string[]
}

export default defineCommand({
  meta: { description: 'List fonts used in the current page' },
  args: {
    page: { type: 'string', description: 'Page name (default: current page)' },
    css: { type: 'boolean', description: 'Output as CSS @font-face template' },
    google: { type: 'boolean', description: 'Output as Google Fonts URL (if available)' },
    out: { type: 'string', alias: 'o', description: 'Write CSS to file' },
    json: { type: 'boolean', description: 'Output as JSON' }
  },
  async run({ args }) {
    try {
      if (args.page) {
        await sendCommand('set-current-page', { name: args.page })
      }

      const fonts = await sendCommand<FontInfo[]>('get-fonts')

      if (!fonts || fonts.length === 0) {
        console.log(args.json ? '[]' : 'No fonts found')
        return
      }

      if (args.json) {
        console.log(JSON.stringify(fonts, null, 2))
        return
      }

      // Fetch Google Fonts list once
      const googleFontsList = await fetchGoogleFonts()
      const isGoogle = (family: string) => googleFontsList.has(family)

      if (args.css || args.out) {
        const root = createRoot()

        // Add Google Fonts import if any
        const googleFonts = fonts
          .filter((f) => isGoogle(f.family))
          .map((f) => ({
            family: f.family,
            weights: f.styles.map(styleToWeight)
          }))

        if (googleFonts.length > 0) {
          root.append(googleFontsImport(googleFonts))
        }

        // Add @font-face for non-Google fonts
        for (const font of fonts) {
          if (isGoogle(font.family)) continue

          for (const style of font.styles) {
            const weight = styleToWeight(style)
            const fontStyle = style.toLowerCase().includes('italic') ? 'italic' : 'normal'
            const filename = `${font.family.replace(/\s+/g, '-')}-${style}`

            root.append(
              createFontFace({
                family: font.family,
                weight,
                style: fontStyle as 'normal' | 'italic',
                src: createFontFaceSrc([
                  { url: `./fonts/${filename}.woff2`, format: 'woff2' },
                  { url: `./fonts/${filename}.woff`, format: 'woff' }
                ])
              })
            )
          }
        }

        const css = root.toString()

        if (args.out) {
          writeFileSync(args.out, css)
          console.log(`Written to ${args.out}`)
        } else {
          console.log(css)
        }
        return
      }

      if (args.google) {
        const googleFonts = fonts.filter((f) => isGoogle(f.family))
        if (googleFonts.length === 0) {
          console.log('No Google Fonts found. These fonts need to be loaded manually:')
          for (const font of fonts) {
            console.log(`  - ${font.family} (${font.styles.join(', ')})`)
          }
          return
        }

        console.log(
          googleFontsUrl(
            googleFonts.map((f) => ({
              family: f.family,
              weights: f.styles.map(styleToWeight)
            }))
          )
        )

        const nonGoogle = fonts.filter((f) => !isGoogle(f.family))
        if (nonGoogle.length > 0) {
          console.log('\nThese fonts need to be loaded manually:')
          for (const font of nonGoogle) {
            console.log(`  - ${font.family} (${font.styles.join(', ')})`)
          }
        }
        return
      }

      // Default: list fonts
      console.log('Fonts used:')
      for (const font of fonts) {
        const googleFont = isGoogle(font.family)
        console.log(`  ${font.family}${googleFont ? ' (Google Fonts)' : ''}`)
        for (const style of font.styles) {
          console.log(`    - ${style} (${styleToWeight(style)})`)
        }
      }
    } catch (e) {
      handleError(e)
    }
  }
})

function styleToWeight(style: string): number {
  const styleMap: Record<string, number> = {
    Thin: 100,
    Hairline: 100,
    ExtraLight: 200,
    UltraLight: 200,
    Light: 300,
    Regular: 400,
    Normal: 400,
    Medium: 500,
    SemiBold: 600,
    DemiBold: 600,
    Bold: 700,
    ExtraBold: 800,
    UltraBold: 800,
    Black: 900,
    Heavy: 900
  }

  for (const [key, weight] of Object.entries(styleMap)) {
    if (style.includes(key)) return weight
  }
  return 400
}

let googleFontsCache: Set<string> | null = null

async function fetchGoogleFonts(): Promise<Set<string>> {
  if (googleFontsCache) return googleFontsCache

  try {
    const res = await fetch('https://fonts.google.com/metadata/fonts')
    const data = (await res.json()) as { familyMetadataList: Array<{ family: string }> }
    googleFontsCache = new Set(data.familyMetadataList.map((f) => f.family))
    return googleFontsCache
  } catch {
    // Fallback to common fonts if API fails
    return new Set([
      'Inter',
      'Roboto',
      'Open Sans',
      'Lato',
      'Montserrat',
      'Poppins',
      'Nunito',
      'Raleway',
      'Ubuntu',
      'Noto Sans',
      'PT Sans',
      'Fira Sans',
      'Work Sans',
      'Rubik',
      'DM Sans',
      'Manrope',
      'Space Grotesk'
    ])
  }
}

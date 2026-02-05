import * as esbuild from 'esbuild'
import * as fs from 'fs'
import * as path from 'path'

const distDir = path.join(import.meta.dir, 'dist')
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir)
}

await esbuild.build({
  entryPoints: [path.join(import.meta.dir, 'src/main.ts')],
  bundle: true,
  outfile: path.join(distDir, 'main.js'),
  format: 'iife',
  target: 'es2020',
  minify: false
})

// Create minimal UI HTML
const uiHtml = `<!DOCTYPE html>
<html>
<head><title>Figma Bridge</title></head>
<body><script>window.onmessage = (e) => parent.postMessage({ pluginMessage: e.data.pluginMessage }, '*')</script></body>
</html>`
fs.writeFileSync(path.join(distDir, 'ui.html'), uiHtml)

console.log('Plugin built successfully!')

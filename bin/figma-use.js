#!/usr/bin/env bun
import { spawn } from 'child_process'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const cliPath = join(__dirname, '..', 'dist', 'cli', 'index.js')

const child = spawn('bun', ['run', cliPath, ...process.argv.slice(2)], { stdio: 'inherit' })
child.on('exit', (code) => process.exit(code || 0))

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const source = process.env.DIST_OUT || 'C:\\temp\\translate_app_release'
const target = path.join(root, 'release')

if (!fs.existsSync(source)) {
  console.error(`Build output not found: ${source}`)
  process.exit(1)
}

fs.mkdirSync(target, { recursive: true })

for (const name of fs.readdirSync(source)) {
  if (!/\.(exe|yml|yaml|blockmap)$/i.test(name) && name !== 'win-unpacked') continue
  // Prefer installer artifacts at top level; skip copying full unpacked tree by default
  if (name === 'win-unpacked') continue
  const from = path.join(source, name)
  const to = path.join(target, name)
  fs.copyFileSync(from, to)
  console.log(`Copied ${name}`)
}

const setup = fs.readdirSync(target).find((n) => /Setup.*\.exe$/i.test(n) || /portable/i.test(n))
if (!setup) {
  // If only unpacked exists, copy a note
  console.warn('No installer exe found in release/. Check', source)
} else {
  console.log(`Installer ready: ${path.join(target, setup)}`)
}

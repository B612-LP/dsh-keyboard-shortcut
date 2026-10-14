/**
 * Build script for dsh-keyboard-shortcut.
 *
 * Produces the two artifacts DSH loads:
 *
 * - `lib/index.js` — the Host half, shipped as plain ESM. Nothing bundles it.
 * - `lib/client.js` — the browser half, wrapped in the module-registration
 *   envelope `@deepseek-ai/dsh-client-modules` expects.
 *
 * ## Why the client half needs a wrapper
 *
 * The browser kernel does not load plugin code as an ES module. Each served
 * bundle must call `window.__ModuleLoader__.load({id, factory})` during its own
 * execution; the kernel's queue facade records the registration, and the
 * factory runs later, when the module is first materialized. Everything a
 * plugin bundle does at module scope therefore has to live inside the factory
 * closure.
 *
 * Inside the factory the plugin gets a `require` that resolves against the
 * kernel's frozen platform table (React, and the static UI libraries) plus the
 * package rows of the composed boot graph. Anything outside that baseline has
 * to be declared in `dsh.client.external`, and nothing is here: this plugin
 * requires only React and the UI primitives, both of which are baseline.
 *
 * ## Externals
 *
 * `react`, `react/jsx-runtime`, and the `@deepseek-ai/*` runtime packages are
 * marked external so esbuild leaves the `require` calls alone. Bundling a second
 * copy of React would break hooks, and bundling a second copy of DSH's services
 * would break the slot and shortcut registries, because both compare identity.
 *
 * Usage:
 *   node scripts/build.mjs            build both artifacts
 *   node scripts/build.mjs --watch    rebuild the client half on change
 *   node scripts/build.mjs --check    verify the committed artifacts are fresh
 */

import { build, context } from 'esbuild'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const pkg = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'))

/** Module identifiers the kernel already provides; never bundled. */
const EXTERNAL = [
  'react',
  'react-dom',
  'react/jsx-runtime',
  'react-dom/client',
  '@deepseek-ai/*'
]

const args = new Set(process.argv.slice(2))
const watch = args.has('--watch')
const check = args.has('--check')

/**
 * Wrap bundled client code in the kernel's registration envelope.
 *
 * The envelope is CommonJS-shaped on purpose: esbuild's `cjs` output already
 * reads `module.exports`, `exports`, and `require`, so the wrapper only has to
 * supply them. `Symbol.toStringTag` matches what the shipped bundles set, which
 * keeps `import()` interop consistent for anything that inspects the namespace.
 *
 * @param code - Bundled CommonJS source.
 * @returns The wrapped bundle.
 */
function wrapClient(code) {
  return `/**
 * ${pkg.name} — browser half.
 * GENERATED FILE — do not edit. Source lives in src/client/; run \`npm run build\`.
 */
window.__ModuleLoader__.load({
  id: ${JSON.stringify(pkg.name)},
  factory: (require) => {
    var module = { exports: {} }
    var exports = module.exports
    Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' })
${indent(code, 4)}
    return module.exports
  },
})
`
}

/**
 * Indent every non-empty line of a block.
 *
 * @param text - Source to indent.
 * @param spaces - Indent width.
 * @returns The indented text.
 */
function indent(text, spaces) {
  const pad = ' '.repeat(spaces)
  return text
    .split('\n')
    .map((line) => (line.trim() === '' ? line : pad + line))
    .join('\n')
}

/**
 * Bundle the browser half.
 *
 * @returns The wrapped bundle source.
 */
async function buildClient() {
  const result = await build({
    entryPoints: [resolve(root, 'src/client/index.js')],
    bundle: true,
    format: 'cjs',
    platform: 'browser',
    target: ['chrome120'],
    external: EXTERNAL,
    write: false,
    logLevel: 'warning',
    legalComments: 'none',
    // The kernel's factories are CommonJS; a `__esModule` marker would make
    // interop helpers treat the namespace as a transpiled module.
    banner: { js: '' },
    define: { 'process.env.NODE_ENV': JSON.stringify('production') }
  })
  const output = result.outputFiles?.[0]
  if (output === undefined) throw new Error('esbuild produced no client output')
  return wrapClient(output.text)
}

/**
 * Copy the Host half verbatim.
 *
 * It is hand-written ESM with no dependencies, so a bundler would only strip
 * the JSDoc that documents why it exists.
 *
 * @returns The Host half source.
 */
async function buildHost() {
  return readFile(resolve(root, 'src/host/index.js'), 'utf8')
}

/**
 * Write a file only when its content changed.
 *
 * @param path - Absolute destination.
 * @param content - Desired content.
 * @returns Whether the file was written.
 */
async function writeIfChanged(path, content) {
  await mkdir(dirname(path), { recursive: true })
  try {
    const existing = await readFile(path, 'utf8')
    if (existing === content) return false
  } catch {
    // Missing file: fall through to the write.
  }
  await writeFile(path, content, 'utf8')
  return true
}

/**
 * Report a short content digest, for build logs and freshness checks.
 *
 * @param content - File content.
 * @returns The first twelve hex characters of the SHA-256 digest.
 */
function digest(content) {
  return createHash('sha256').update(content).digest('hex').slice(0, 12)
}

if (check) {
  const client = await buildClient()
  const host = await buildHost()
  const checks = [
    [resolve(root, 'lib/client.js'), client],
    [resolve(root, 'lib/index.js'), host]
  ]
  let stale = false
  for (const [path, expected] of checks) {
    let actual
    try {
      actual = await readFile(path, 'utf8')
    } catch {
      actual = undefined
    }
    if (actual !== expected) {
      stale = true
      console.error(`stale: ${path.replace(`${root}\\`, '').replace(`${root}/`, '')}`)
    }
  }
  if (stale) {
    console.error('Run `npm run build` and commit the result.')
    process.exit(1)
  }
  console.log('build artifacts are up to date')
} else if (watch) {
  const client = await context({
    entryPoints: [resolve(root, 'src/client/index.js')],
    bundle: true,
    format: 'cjs',
    platform: 'browser',
    target: ['chrome120'],
    external: EXTERNAL,
    outfile: resolve(root, 'lib/client.raw.js'),
    logLevel: 'info'
  })
  await client.watch()
  console.log('watching src/client/** — press Ctrl+C to stop')
} else {
  const client = await buildClient()
  const host = await buildHost()
  const wroteClient = await writeIfChanged(resolve(root, 'lib/client.js'), client)
  const wroteHost = await writeIfChanged(resolve(root, 'lib/index.js'), host)
  console.log(
    `lib/client.js  ${digest(client)}  ${wroteClient ? 'written' : 'unchanged'} (${client.length} bytes)`
  )
  console.log(
    `lib/index.js   ${digest(host)}  ${wroteHost ? 'written' : 'unchanged'} (${host.length} bytes)`
  )
}

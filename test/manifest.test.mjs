/**
 * Reproduce `@deepseek-ai/dsh-client-modules` manifest validation for this
 * package, so a packaging mistake is caught before it is blamed on the live
 * Host graph.
 *
 * Checks exactly what `resolveMeta()` checks: `dsh.client.platform === 'web'`,
 * `exports["./client"]` resolving to a string, that file existing, and the
 * served bundle being a ModuleLoader registration under this package's name.
 */

import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, it } from 'node:test'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

/**
 * Read and parse one JSON file.
 *
 * @param path - Absolute path.
 * @returns The parsed value.
 */
function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'))
}

/**
 * Resolve `exports["./client"]`, matching the kernel's accepted shapes.
 *
 * @param pkg - A parsed manifest.
 * @returns The relative client path, or `undefined`.
 */
function clientExportOf(pkg) {
  const client = pkg.exports?.['./client']
  if (typeof client === 'string') return client
  if (typeof client === 'object' && client !== null && typeof client.default === 'string') {
    return client.default
  }
  return undefined
}

describe('package manifest', () => {
  const pkg = readJson(join(root, 'package.json'))

  it('declares a web client half', () => {
    assert.equal(typeof pkg.dsh?.client?.platform, 'string')
    assert.equal(pkg.dsh.client.platform, 'web')
  })

  it('resolves exports["./client"] to an existing bundle', () => {
    const relative = clientExportOf(pkg)
    assert.equal(typeof relative, 'string', 'exports["./client"] must resolve to a string')
    assert.equal(existsSync(join(root, relative)), true, `${relative} must exist`)
  })

  it('ships the bundle as a ModuleLoader registration under the package name', () => {
    const relative = clientExportOf(pkg)
    const source = readFileSync(join(root, relative), 'utf8')
    assert.match(source, /window\.__ModuleLoader__\.load\(/u)
    assert.match(source, new RegExp(`id: ${JSON.stringify(pkg.name)}`, 'u'))
    assert.match(source, /factory: \(require\) =>/u)
  })

  it('ships a Host entry that exports apply and name', () => {
    const source = readFileSync(join(root, pkg.main), 'utf8')
    assert.match(source, /export function apply/u)
    assert.match(source, /export const name = /u)
  })

  it('declares the bundle patch the Host reads', () => {
    const patch = pkg.dsh?.bundle?.patch
    assert.equal(typeof patch, 'string')
    assert.equal(existsSync(join(root, patch)), true, `${patch} must exist`)
  })

  it('names one bundle row whose module name is this package', () => {
    const patch = readFileSync(join(root, pkg.dsh.bundle.patch), 'utf8')
    assert.match(patch, /id: keyboard-shortcut/u)
    assert.match(patch, new RegExp(`name: '${pkg.name}'`, 'u'))
  })

  it('lists only files the package actually ships', () => {
    // The published `files` list must cover both halves plus the patch, or the
    // installed package silently loses its client bundle.
    for (const required of ['lib', 'cordis.patch.yml']) {
      assert.equal(pkg.files.includes(required), true, `files must include ${required}`)
    }
  })
})

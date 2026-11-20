import { execFileSync } from 'node:child_process'
import {
  lstatSync,
  mkdirSync,
  readFileSync,
  realpathSync,
  renameSync,
  rmdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { join, resolve } from 'node:path'

const harnesses = ['pi', 'opencode', 'claude-code', 'codex']

function git(directory, ...args) {
  return execFileSync('git', ['-C', directory, 'rev-parse', ...args], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trimEnd()
}

function markerPath(directory) {
  try {
    const root = git(directory, '--show-toplevel')
    if (realpathSync(root) !== realpathSync(directory)) {
      throw new Error('Use the checkout root.')
    }
    return resolve(root, git(root, '--git-path', 'ai-workflow-initiate.json'))
  } catch {
    throw new Error(`Use the root of an accessible Git worktree: ${directory}`)
  }
}

function readMarker(path) {
  try {
    if (!lstatSync(path).isFile()) throw new Error('Expected a regular file.')
  } catch (error) {
    if (error.code === 'ENOENT') return null
    throw error
  }

  const marker = JSON.parse(readFileSync(path, 'utf8'))
  const verified = marker?.verifiedHarnesses
  if (
    marker?.schemaVersion !== 1 ||
    !Array.isArray(verified) ||
    verified.some((id) => !harnesses.includes(id)) ||
    new Set(verified).size !== verified.length
  ) {
    throw new Error('Expected schemaVersion 1 and unique, supported harness IDs.')
  }
  return marker
}

function recordVerified(path, verified) {
  const lock = `${path}.lock`
  mkdirSync(lock)
  try {
    const previous = readMarker(path)
    const combined = new Set([...(previous?.verifiedHarnesses ?? []), ...verified])
    if (combined.size === previous?.verifiedHarnesses.length) return previous

    const marker = {
      schemaVersion: 1,
      verifiedHarnesses: harnesses.filter((id) => combined.has(id)),
    }
    const temporary = join(lock, 'marker.json')
    writeFileSync(temporary, JSON.stringify(marker, null, 2) + '\n', { flag: 'wx' })
    renameSync(temporary, path)
    return marker
  } finally {
    rmSync(join(lock, 'marker.json'), { force: true })
    rmdirSync(lock)
  }
}

try {
  const [command, directory, ...verified] = process.argv.slice(2)
  const reading = command === 'show' && verified.length === 0
  const recording =
    command === 'record' && verified.length > 0 && verified.every((id) => harnesses.includes(id))
  if (!directory || (!reading && !recording)) {
    throw new Error('Usage: node marker.mjs show <checkout> | record <checkout> <harness>...')
  }

  const path = markerPath(directory)
  try {
    const marker = reading ? readMarker(path) : recordVerified(path, verified)
    console.log(marker ? JSON.stringify(marker) : 'uninitialized')
  } catch (error) {
    throw new Error(`Cannot ${command} readiness at ${path}: ${error.message}`)
  }
} catch (error) {
  console.error(`Initiate: ${error.message}`)
  process.exitCode = 1
}

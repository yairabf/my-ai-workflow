import { execFileSync } from 'node:child_process'
import {
  chmodSync, linkSync, mkdirSync, mkdtempSync, readFileSync, readdirSync,
  renameSync, rmdirSync, rmSync, unlinkSync, writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, posix } from 'node:path'
import {
  bundledPaths, checkWritableParent, ciPath, rolePaths, sourceRoot, stampPath, stat, targetPath,
} from './install.mjs'

const commitPattern = /^[a-f0-9]{40}$/
const executableBits = 0o111

function git(repository, ...args) {
  const env = { ...process.env }
  // Git hooks can export repository paths. The baseline must stay in staging.
  for (const name of ['GIT_DIR', 'GIT_WORK_TREE', 'GIT_COMMON_DIR', 'GIT_INDEX_FILE',
    'GIT_OBJECT_DIRECTORY', 'GIT_ALTERNATE_OBJECT_DIRECTORIES', 'GIT_SHALLOW_FILE']) {
    delete env[name]
  }
  try {
    return execFileSync('git', ['-C', repository, '--no-replace-objects', ...args], {
      env, stdio: ['ignore', 'pipe', 'pipe'], timeout: 180_000,
    })
  } catch (error) {
    throw new Error(`Git ${args[0]} failed (${error.code ?? error.status ?? error.signal}).`)
  }
}

function readFile(path, info = stat(path)) {
  if (!info) return undefined
  if (!info.isFile()) throw new Error(`Expected a regular file at ${path}`)
  return { bytes: readFileSync(path), mode: info.mode & 0o777 }
}

function targetFile(target, path) {
  const destination = join(targetPath(target, posix.dirname(path)), posix.basename(path))
  let parent = target
  for (const name of path.split('/')) {
    const child = join(parent, name)
    if (!stat(child)) break
    if (!readdirSync(parent).includes(name)) {
      throw new Error(`Upgrade path spelling differs from the installed entry at ${child}`)
    }
    parent = child
  }
  return destination
}

function sameEntry(left, right) {
  if (!left || !right) return left === right
  if (left.directory || right.directory) return left.directory === right.directory
  return (left.mode & executableBits) === (right.mode & executableBits) &&
    left.bytes.equals(right.bytes)
}

function fetchBaseline(directory, repository, revision) {
  try {
    git(directory, 'init', '--quiet')
    git(directory, 'fetch', '--no-tags', '--no-recurse-submodules', '--depth=1', '--', repository, revision)
    const fetched = git(directory, 'rev-parse', 'FETCH_HEAD^{commit}').toString().trim()
    if (fetched !== revision) throw new Error('Fetched a different commit.')
    git(directory, 'cat-file', '-e', `${revision}:engineering-workflows/install.mjs`)
  } catch (error) {
    throw new Error(`Cannot recover installed revision ${revision} from the pack source: ${error.message}`)
  }
}

function baselineFiles(directory, revision, { source, target }) {
  const entries = git(directory, 'ls-tree', '-rz', revision, '--', source).toString().split('\0')
  return entries.filter(Boolean).map((entry) => {
    const tab = entry.indexOf('\t')
    const [mode, type, object] = entry.slice(0, tab).split(' ')
    const path = entry.slice(tab + 1)
    const suffix = path.slice(source.length)
    if (type !== 'blob' || !['100644', '100755'].includes(mode) || path.includes('\\') ||
        (path !== source && !path.startsWith(source + '/')) ||
        path.split('/').some((part) => !part || part === '.' || part === '..')) {
      throw new Error(`Unsupported pack path at ${revision}: ${path}`)
    }
    return [target + suffix, {
      bytes: git(directory, 'cat-file', 'blob', object),
      mode: Number.parseInt(mode.slice(-3), 8),
    }]
  })
}

function incomingFiles(source, target) {
  const info = stat(source)
  if (!info) return []
  if (info.isDirectory()) {
    return readdirSync(source).flatMap((name) => {
      if (name.includes('\\')) throw new Error(`Unsupported pack path: ${join(source, name)}`)
      return incomingFiles(join(source, name), `${target}/${name}`)
    })
  }
  return [[target, readFile(source, info)]]
}

function parents(path) {
  const directories = []
  for (let parent = posix.dirname(path); parent !== '.'; parent = posix.dirname(parent)) {
    directories.push(parent)
  }
  return directories
}

function recordDirectoryRemovals(target, path, oldFiles, oldDirectories, changes, conflicts) {
  const directory = targetPath(target, path)
  for (const name of readdirSync(directory)) {
    const child = `${path}/${name}`
    const info = stat(join(directory, name))
    if (oldDirectories.has(child) && info?.isDirectory()) {
      recordDirectoryRemovals(target, child, oldFiles, oldDirectories, changes, conflicts)
    } else if (!oldFiles.has(child) || !info?.isFile()) {
      conflicts.add(child)
    }
  }
  changes.push({ path, current: { directory: true, mode: stat(directory).mode & 0o777 } })
}

function planPathTransitions(target, baseline, incoming, conflicts) {
  const oldDirectories = new Set([...baseline.keys()].flatMap(parents))
  const newDirectories = new Set([...incoming.keys()].flatMap(parents))
  const expanding = new Set([...baseline.keys()].filter((path) => newDirectories.has(path)))
  const collapsing = new Set([...incoming.keys()].filter((path) => oldDirectories.has(path)))
  const hiddenChildren = new Set()
  const directoryRemovals = []
  for (const path of [...expanding, ...collapsing]) {
    const info = stat(targetFile(target, path))
    if (info?.isFile()) hiddenChildren.add(path)
    if (info?.isDirectory() && collapsing.has(path)) {
      recordDirectoryRemovals(target, path, baseline, oldDirectories, directoryRemovals, conflicts)
    }
  }

  const directoryAdditions = []
  for (const path of [...newDirectories].sort((left, right) => left.length - right.length)) {
    if (!expanding.has(path) && !parents(path).some((parent) => expanding.has(parent))) continue
    if (!hiddenChildren.has(path) && !parents(path).some((parent) => hiddenChildren.has(parent)) &&
        stat(targetFile(target, path))) continue
    directoryAdditions.push({ path, next: { directory: true, mode: 0o777 & ~process.umask() } })
  }
  return { expanding, collapsing, hiddenChildren, directoryRemovals, directoryAdditions }
}

function changedFiles(target, baseline, incoming) {
  const changes = []
  const conflicts = new Set()
  const transitions = planPathTransitions(target, baseline, incoming, conflicts)
  for (const path of new Set([...baseline.keys(), ...incoming.keys()])) {
    if (conflicts.has(path)) continue
    const previous = baseline.get(path)
    const next = incoming.get(path)
    if (sameEntry(previous, next)) continue
    let current
    if (!parents(path).some((parent) => transitions.hiddenChildren.has(parent) || conflicts.has(parent))) {
      const destination = targetFile(target, path)
      const info = stat(destination)
      const transitionsThroughDirectory = transitions.expanding.has(path) || transitions.collapsing.has(path)
      if (!(transitionsThroughDirectory && info?.isDirectory())) current = readFile(destination, info)
    }
    if (sameEntry(current, next)) continue
    if (!sameEntry(current, previous)) {
      conflicts.add(path)
      continue
    }
    if (current && next) {
      const mode = (current.mode & ~executableBits) | (next.mode & executableBits)
      changes.push({ path, current, next: { ...next, mode } })
    } else {
      changes.push({ path, current, next })
    }
  }
  if (conflicts.size) throwUpgradeConflicts(conflicts)
  return {
    changes: [
      ...changes.filter(({ next }) => !next),
      ...transitions.directoryRemovals,
      ...transitions.directoryAdditions,
      ...changes.filter(({ next }) => next),
    ],
    removed: [...baseline.keys()].filter((path) => !incoming.has(path) &&
      !parents(path).some((parent) => transitions.collapsing.has(parent))),
  }
}

function throwUpgradeConflicts(conflicts) {
  throw new Error(`Upgrade conflicts with local changes at:\n  ${[...conflicts].sort().join('\n  ')}`)
}

export function prepareUpgrade(target, revision, repository) {
  if (!commitPattern.test(revision)) throw new Error('Expected a full incoming Git commit pin.')
  const stamp = readFile(targetFile(target, stampPath))
  const previous = stamp?.bytes.toString().trim()
  if (!commitPattern.test(previous)) {
    throw new Error(`Expected an installed Git commit pin at ${stampPath}. Run setup for a fresh install.`)
  }
  if (previous === revision) return { previous }

  const directory = mkdtempSync(join(tmpdir(), 'workflow-upgrade-base-'))
  try {
    fetchBaseline(directory, repository, previous)
    const paths = [...rolePaths, ...bundledPaths]
    if (stat(targetFile(target, ciPath.target))) paths.push(ciPath)
    const baseline = new Map(paths.flatMap((path) => baselineFiles(directory, previous, path)))
    const incoming = new Map(paths.flatMap((path) => incomingFiles(join(sourceRoot, path.source), path.target)))
    return { previous, stamp, ...changedFiles(target, baseline, incoming) }
  } finally {
    rmSync(directory, { recursive: true, force: true })
  }
}

function checkUnchanged(path, expected) {
  const info = stat(path)
  const current = info?.isDirectory()
    ? { directory: true, mode: info.mode & 0o777 }
    : readFile(path, info)
  if (!sameEntry(current, expected) || current?.mode !== expected?.mode) {
    throw new Error(`File changed while preparing the upgrade: ${path}`)
  }
}

function cleanUp(path, remove) {
  try {
    remove(path)
  } catch (error) {
    console.warn(`Could not remove upgrade temporary path ${path}: ${error.message}`)
  }
}

function applyEntry(target, { path, current, next }) {
  const destination = targetFile(target, path)
  checkWritableParent(destination)
  if (!next) {
    checkUnchanged(destination, current)
    const remove = current.directory ? rmdirSync : unlinkSync
    remove(destination)
    return
  }
  if (next.directory) {
    mkdirSync(dirname(destination), { recursive: true })
    checkUnchanged(destination, current)
    mkdirSync(destination)
    try {
      chmodSync(destination, next.mode)
    } catch (error) {
      cleanUp(destination, rmdirSync)
      throw error
    }
    return
  }

  const parent = dirname(destination)
  mkdirSync(parent, { recursive: true })
  const stage = mkdtempSync(join(parent, '.workflow-upgrade-'))
  try {
    const file = join(stage, 'content')
    writeFileSync(file, next.bytes)
    chmodSync(file, next.mode)
    checkUnchanged(targetFile(target, path), current)
    // A concurrent addition must never be overwritten.
    if (current) renameSync(file, destination)
    else linkSync(file, destination)
  } finally {
    cleanUp(stage, (path) => rmSync(path, { recursive: true, force: true }))
  }
}

function applyUpgrade(target, changes) {
  const applied = []
  try {
    for (const change of changes) {
      applyEntry(target, change)
      applied.push(change)
    }
  } catch (error) {
    const rollbackErrors = []
    for (const { path, current, next } of applied.reverse()) {
      try {
        applyEntry(target, { path, current: next, next: current })
      } catch (rollbackError) {
        rollbackErrors.push(rollbackError.message)
      }
    }
    if (!rollbackErrors.length) throw error
    throw new Error(`${error.message}\nCould not restore every applied file:\n  ${rollbackErrors.join('\n  ')}\nResolve the reported paths and retry the same upgrade.`)
  }
}

function pruneEmptyDirectories(target, removed) {
  for (const path of removed) {
    const root = [...rolePaths, ...bundledPaths].find(({ target }) => path.startsWith(target + '/'))
    if (!root) continue
    for (let parent = posix.dirname(path); parent.length >= root.target.length; parent = posix.dirname(parent)) {
      try {
        const directory = targetPath(target, parent)
        if (stat(directory)) rmdirSync(directory)
      } catch (error) {
        if (!['ENOENT', 'ENOTEMPTY', 'EEXIST'].includes(error.code)) {
          console.warn(`Could not remove empty upgrade directory ${parent}: ${error.message}`)
        }
        break
      }
    }
  }
}

export function upgrade(target, revision, repository) {
  const { previous, stamp, changes, removed } = prepareUpgrade(target, revision, repository)
  if (previous === revision) {
    console.log(`Already installed Engineering Workflows at ${revision}`)
    return
  }

  const lock = targetFile(target, '.engineering-workflows/.upgrade-lock')
  try {
    mkdirSync(lock)
  } catch (error) {
    if (error.code !== 'EEXIST') throw error
    throw new Error(`Another upgrade is using ${lock}. Retry after it finishes.`)
  }
  try {
    checkUnchanged(targetFile(target, stampPath), stamp)
    const next = { bytes: Buffer.from(revision + '\n'), mode: stamp.mode }
    applyUpgrade(target, [...changes, { path: stampPath, current: stamp, next }])
    pruneEmptyDirectories(target, removed)
  } finally {
    cleanUp(lock, rmdirSync)
  }
  console.log(`Upgraded Engineering Workflows from ${previous} to ${revision}`)
}

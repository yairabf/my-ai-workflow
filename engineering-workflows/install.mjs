import { execFileSync } from 'node:child_process'
import {
  accessSync,
  constants,
  cpSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  realpathSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const pack = fileURLToPath(new URL('.', import.meta.url))
const source = dirname(resolve(pack))
const roles = ['workflow-initiate', 'workflow-investigate']
const roots = ['.agents/skills', '.claude/skills']
const prerequisites = ['.agents/skills/grill-me', '.agents/skills/grilling']

function git(directory, ...args) {
  return execFileSync('git', ['-C', directory, ...args], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trimEnd()
}

function stat(path) {
  try {
    return lstatSync(path)
  } catch (error) {
    if (error.code !== 'ENOENT') throw error
  }
}

function sameTree(left, right) {
  const leftStat = stat(left)
  const rightStat = stat(right)
  if (leftStat?.isFile() && rightStat?.isFile()) {
    return (leftStat.mode & 0o111) === (rightStat.mode & 0o111) &&
      readFileSync(left).equals(readFileSync(right))
  }
  if (!leftStat?.isDirectory() || !rightStat?.isDirectory()) return false

  const names = readdirSync(left)
  return names.length === readdirSync(right).length &&
    names.every((name) => sameTree(join(left, name), join(right, name)))
}

function targetPath(target, relative) {
  let path = target
  for (const part of relative.split('/')) {
    path = join(path, part)
    const existing = stat(path)
    if (existing && !existing.isDirectory()) {
      throw new Error(`Expected a directory at ${path}`)
    }
  }
  return path
}

function checkWritableParent(destination) {
  let parent = dirname(destination)
  while (!stat(parent)) parent = dirname(parent)
  try {
    accessSync(parent, constants.W_OK | constants.X_OK)
  } catch (error) {
    if (error.code !== 'EACCES' && error.code !== 'EPERM' && error.code !== 'EROFS') throw error
    throw new Error(`Cannot install ${destination}: write or traversal access denied at ${parent}`)
  }
}

function register(from, to) {
  const parent = dirname(to)
  mkdirSync(parent, { recursive: true })
  const stage = mkdtempSync(join(parent, '.workflow-install-'))
  try {
    const staged = join(stage, 'content')
    cpSync(from, staged, { recursive: true })
    if (stat(to)) throw new Error(`Destination appeared during installation: ${to}`)
    renameSync(staged, to)
  } finally {
    rmSync(stage, { recursive: true, force: true })
  }
}

function install(target) {
  const revision = git(source, 'rev-parse', 'HEAD')
  const changes = git(source, 'status', '--porcelain', '--untracked-files=all', '--ignored=matching',
    '--', 'engineering-workflows', ...prerequisites)
  if (changes) throw new Error('Run the installer from a clean checkout of the chosen pack revision.')

  const resources = mkdtempSync(join(tmpdir(), 'engineering-workflows-'))
  try {
    const bundled = join(resources, 'prerequisites')
    mkdirSync(bundled)
    for (const path of prerequisites) {
      cpSync(join(source, path), join(bundled, path.split('/').at(-1)), { recursive: true })
    }
    writeFileSync(join(resources, 'revision.txt'), revision + '\n')

    const copies = roots.flatMap((root) => roles.map((role) => {
      const path = `${root}/${role}`
      return [join(pack, path), targetPath(target, path)]
    }))
    copies.push([resources, targetPath(target, '.engineering-workflows')])

    const missing = copies.filter(([from, to]) => {
      if (!stat(to)) return true
      if (!sameTree(from, to)) throw new Error(`Existing content differs at ${to}`)
      return false
    })
    for (const [, to] of missing) checkWritableParent(to)
    for (const [from, to] of missing) register(from, to)

    const result = missing.length ? 'Installed' : 'Already installed'
    console.log(`${result} Engineering Workflows at ${revision}`)
  } finally {
    rmSync(resources, { recursive: true, force: true })
  }
}

try {
  if (process.argv.length !== 3) {
    throw new Error('Usage: node engineering-workflows/install.mjs <target-git-root>')
  }
  const requested = resolve(process.argv[2])
  let target
  try {
    target = realpathSync(git(requested, 'rev-parse', '--show-toplevel'))
    if (target !== realpathSync(requested)) throw new Error('Expected the Git root.')
  } catch {
    throw new Error(`Use the root of an accessible Git worktree: ${requested}`)
  }
  install(target)
} catch (error) {
  const diagnostic = error.stderr?.trim() || error.message
  console.error(`Engineering Workflows: ${diagnostic}`)
  process.exitCode = 1
}

import { execFileSync } from 'node:child_process'
import {
  accessSync,
  constants,
  cpSync,
  linkSync,
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
const roles = ['workflow-initiate', 'workflow-investigate', 'workflow-plan']
const roots = ['.agents/skills', '.claude/skills']
const prerequisites = ['.agents/skills/grill-me', '.agents/skills/grilling']

function git(directory, ...args) {
  return execFileSync('git', ['-C', directory, ...args], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trimEnd()
}

export function stat(path) {
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

export function targetPath(target, relative) {
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

export function checkWritableParent(destination) {
  let parent = dirname(destination)
  while (!stat(parent)) parent = dirname(parent)
  try {
    accessSync(parent, constants.W_OK | constants.X_OK)
  } catch (error) {
    if (error.code !== 'EACCES' && error.code !== 'EPERM' && error.code !== 'EROFS') throw error
    throw new Error(`Cannot install ${destination}: write or traversal access denied at ${parent}`)
  }
}

export function register(from, to) {
  const parent = dirname(to)
  mkdirSync(parent, { recursive: true })
  const stage = mkdtempSync(join(parent, '.workflow-install-'))
  try {
    const staged = join(stage, 'content')
    cpSync(from, staged, { recursive: true })
    if (stat(to)) throw new Error(`Destination appeared during installation: ${to}`)
    if (stat(staged).isFile()) {
      linkSync(staged, to)
    } else {
      renameSync(staged, to)
    }
  } finally {
    rmSync(stage, { recursive: true, force: true })
  }
}

function checkoutRevision() {
  const revision = git(source, 'rev-parse', 'HEAD')
  const changes = git(source, 'status', '--porcelain', '--untracked-files=all', '--ignored=matching',
    '--', 'engineering-workflows', ...prerequisites)
  if (changes) throw new Error('Run the installer from a clean checkout of the chosen pack revision.')
  return revision
}

export function install(target, revision = checkoutRevision(), { githubCi = false } = {}) {
  const destination = targetPath(target, '.engineering-workflows')
  const stamp = join(destination, 'revision.txt')
  if (stat(stamp)?.isFile()) {
    const previous = readFileSync(stamp, 'utf8').trim()
    if (/^[a-f0-9]{40}$/.test(previous) && previous !== revision) {
      throw new Error(`A different workflow pack revision is installed at ${stamp} (${previous}).`)
    }
  }
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
    copies.push([resources, destination])
    if (githubCi) {
      const workflow = 'engineering-workflows.yml'
      copies.push([
        join(pack, 'workflows', workflow),
        join(targetPath(target, '.github/workflows'), workflow),
      ])
    }

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

export function checkoutRoot(directory) {
  const requested = resolve(directory)
  try {
    const target = realpathSync(git(requested, 'rev-parse', '--show-toplevel'))
    if (target !== realpathSync(requested)) throw new Error('Expected the Git root.')
    return target
  } catch {
    throw new Error(`Use the root of an accessible Git worktree: ${requested}`)
  }
}

if (process.argv[1] && stat(process.argv[1]) && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    if (process.argv.length !== 3) {
      throw new Error('Usage: node engineering-workflows/install.mjs <target-git-root>')
    }
    install(checkoutRoot(process.argv[2]))
  } catch (error) {
    console.error(`Engineering Workflows: ${error.message}`)
    process.exitCode = 1
  }
}

import { spawnSync } from 'node:child_process'
import { accessSync, constants, copyFileSync, cpSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, dirname, isAbsolute, join, relative, sep } from 'node:path'
import { checkWritableParent, register, stat, targetPath } from './install.mjs'

const manifest = new URL('.agents/skills/workflow-initiate/references/prerequisites.json', import.meta.url)
export const prerequisites = JSON.parse(readFileSync(manifest, 'utf8'))
export const skillRoots = {
  pi: '.pi/skills',
  opencode: '.opencode/skills',
  'claude-code': '.claude/skills',
  codex: '.agents/skills',
}

export function command(bin, args, cwd, options) {
  return spawnSync(bin, args, {
    cwd, encoding: 'utf8', timeout: 30_000, maxBuffer: 32 * 1024 * 1024, ...options,
  })
}

function run(bin, args, cwd, operation) {
  if (command(bin, args, cwd, { timeout: 180_000 }).status !== 0) {
    throw new Error(operation)
  }
}

export function checkSkill(directory, skill) {
  const definition = join(directory, 'SKILL.md')
  try {
    const body = readFileSync(definition, 'utf8')
    const frontmatter = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(body)?.[1]
    const id = frontmatter?.match(/^name:\s*['"]?([\w-]+)['"]?\s*$/m)?.[1]
    if (id !== skill.id) throw new Error(`Invalid name in ${definition}`)
    for (const file of skill.requiredFiles) {
      const path = join(directory, file)
      const details = stat(path)
      if (!details?.isFile() || !details.size) throw new Error(`Missing or empty resource ${path}`)
      accessSync(path, constants.R_OK)
    }
    if (skill.id === 'grill-me') {
      const companion = join(dirname(realpathSync(directory)), 'grilling')
      checkSkill(companion, { id: 'grilling', requiredFiles: [] })
    }
  } catch (error) {
    if (error.code === 'ENOENT' || error.code === 'EACCES' || error.code === 'EPERM') {
      throw new Error(`Cannot read ${error.path ?? definition}`)
    }
    throw error
  }
}

function destinations(skill) {
  return skill.perHarness
    ? Object.entries(skillRoots).map(([harness, root]) => ({ root, harnesses: [harness] }))
    : [
        { root: skillRoots.codex, harnesses: ['pi', 'opencode', 'codex'] },
        { root: skillRoots['claude-code'], harnesses: ['claude-code'] },
      ]
}

function discoveredWorking(skill, harnesses, discovery) {
  return harnesses.every((harness) => {
    const definition = discovery[harness]?.skills.get(skill.id)
    if (!definition) return false
    try {
      checkSkill(dirname(definition), skill)
      return true
    } catch {
      return false
    }
  })
}

function fetchSource(skill, stage, missing) {
  const git = (args, operation) => run('git', args, stage, operation)
  git(['init', '-q'], 'Cannot initialize a temporary Git checkout.')
  const remote = `https://github.com/${skill.repository}.git`
  git(['remote', 'add', 'origin', remote], 'Cannot configure the staged Git source.')
  git(['config', 'remote.origin.promisor', 'true'], 'Cannot configure the staged Git source.')
  git(['config', 'remote.origin.partialclonefilter', 'blob:none'], 'Cannot configure the staged Git source.')
  git(['fetch', '-q', '--depth=1', '--filter=blob:none', 'origin', skill.revision],
    `Cannot fetch ${skill.repository} at ${skill.revision}. Check GitHub connectivity and access.`)
  const paths = skill.perHarness ? missing.map(({ root }) => `${root}/${skill.id}`) : [skill.directory]
  git(['sparse-checkout', 'set', ...paths], `Cannot select ${skill.repository} skill files.`)
  git(['checkout', '-q', '--detach', 'FETCH_HEAD'], `Cannot unpack ${skill.repository} skill files.`)
  const revision = command('git', ['rev-parse', 'HEAD'], stage).stdout?.trim()
  if (revision !== skill.revision) throw new Error(`Unexpected source revision for ${skill.repository}.`)
}

function graphifyRuntime(target, packageName) {
  if (command('graphify', ['--version'], target).status === 0) return
  const tool = ['uv', 'pipx'].find((bin) => command(bin, ['--version'], target).status === 0)
  if (!tool) throw new Error('Install uv or pipx to provision the missing Graphify CLI.')
  const args = tool === 'uv' ? ['tool', 'install', packageName] : ['install', packageName]
  run(tool, args, target, `Cannot install the ${packageName} CLI with ${tool}.`)
  if (command('graphify', ['--version'], target).status !== 0) {
    throw new Error(`Add the ${tool} tool bin directory to PATH and rerun setup.`)
  }
}

function stageRegistration(skill, stage, root, target) {
  if (!skill.repository) {
    if (skill.source) return join(stage, '.agents/skills', skill.id)
    const bundled = join(target, '.engineering-workflows/prerequisites')
    if (skill.id === 'grill-me') {
      cpSync(join(bundled, skill.id), join(stage, skill.id), { recursive: true })
      cpSync(join(bundled, 'grilling'), join(stage, 'grilling'), { recursive: true, force: false })
      const definition = join(stage, skill.id, 'SKILL.md')
      const body = readFileSync(definition, 'utf8')
      if (!body.includes('../grilling/SKILL.md')) {
        writeFileSync(definition, body.trimEnd() +
          '\n\nIf the Skill tool is unavailable, read and follow [Grilling](../grilling/SKILL.md).\n')
      }
      return join(stage, skill.id)
    }
    return join(bundled, skill.id)
  }
  const original = join(stage, skill.perHarness ? `${root}/${skill.id}` : skill.directory)
  const staged = join(stage, 'registration', root, skill.id)
  cpSync(original, staged, { recursive: true })
  for (const notice of skill.notices) {
    const copy = join(staged, basename(notice))
    if (!stat(copy)) copyFileSync(join(stage, notice), copy)
  }
  if (skill.id === 'ui-ux-pro-max') {
    const definition = join(staged, 'SKILL.md')
    const prefix = '${CLAUDE_PLUGIN_ROOT}/.claude/skills/ui-ux-pro-max/'
    writeFileSync(definition, readFileSync(definition, 'utf8').replaceAll(prefix, `${root}/${skill.id}/`))
  }
  return staged
}

function installedDirectory(target, path, existing) {
  if (existing.isDirectory()) return path
  if (!existing.isSymbolicLink()) throw new Error(`Expected a directory at ${path}`)

  let resolved
  try {
    resolved = realpathSync(path)
  } catch (error) {
    if (['ENOENT', 'ENOTDIR', 'ELOOP', 'EACCES', 'EPERM'].includes(error.code)) {
      throw new Error(`Cannot resolve prerequisite link at ${path}`)
    }
    throw error
  }

  const location = relative(target, resolved)
  if (location === '..' || location.startsWith(`..${sep}`) || isAbsolute(location)) {
    throw new Error(`Prerequisite link points outside the checkout at ${path}`)
  }
  if (!stat(resolved)?.isDirectory()) {
    throw new Error(`Prerequisite link does not point to a directory at ${path}`)
  }
  return resolved
}

export function preparePrerequisites(target, discovery) {
  const failures = []
  // Install the companion first so Grill Me can resolve it as soon as it is registered.
  const ordered = [...prerequisites].sort((a, b) => Number(b.id === 'grilling') - Number(a.id === 'grilling'))
  for (const skill of ordered) {
    const missing = []
    for (const destination of destinations(skill)) {
      try {
        const parent = targetPath(target, destination.root)
        const path = join(parent, skill.id)
        const existing = stat(path)
        if (existing) checkSkill(installedDirectory(target, path, existing), skill)
        else if (!discoveredWorking(skill, destination.harnesses, discovery)) {
          checkWritableParent(path)
          missing.push({ ...destination, path })
        }
      } catch (error) {
        failures.push({ id: skill.id, harnesses: destination.harnesses, message: error.message })
      }
    }
    let stage
    try {
      if (skill.source) graphifyRuntime(target, skill.source)
      if (!missing.length) continue
      stage = mkdtempSync(join(tmpdir(), 'workflow-prerequisite-'))
      if (skill.source) {
        run('git', ['init', '-q'], stage, 'Cannot initialize the Graphify staging checkout.')
        run('graphify', ['install', '--project', '--platform', 'agents'], stage,
          'Graphify cannot stage the generic project skill. Check the installed CLI.')
      }
      if (skill.repository) fetchSource(skill, stage, missing)
      for (const { path, root } of missing) {
        const staged = stageRegistration(skill, stage, root, target)
        checkSkill(staged, skill)
        register(staged, path)
      }
    } catch (error) {
      failures.push({
        id: skill.id,
        harnesses: skill.source ? Object.keys(skillRoots) : missing.flatMap(({ harnesses }) => harnesses),
        message: error.message,
      })
    } finally {
      if (stage) rmSync(stage, { recursive: true, force: true })
    }
  }
  return failures
}

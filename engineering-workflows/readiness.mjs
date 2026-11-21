import { spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import {
  closeSync, copyFileSync, mkdirSync, mkdtempSync, openSync, readFileSync,
  realpathSync, rmSync, writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, isAbsolute, join, resolve } from 'node:path'
import { createInterface } from 'node:readline'
import { checkSkill, command, prerequisites, skillRoots } from './prerequisites.mjs'

const roles = [
  { id: 'workflow-initiate', requiredFiles: [
    'references/preparation.md', 'references/prerequisites.json', 'references/readiness.md', 'scripts/marker.mjs',
  ] },
  { id: 'workflow-investigate', requiredFiles: ['references/investigation-brief.md'] },
  { id: 'workflow-plan', requiredFiles: ['references/implementation-plan.md'] },
]
const uiSkill = prerequisites.find(({ id }) => id === 'ui-ux-pro-max')

function permitted(rules, id) {
  return rules.findLast(({ permission, pattern }) => {
    if (permission !== '*' && permission !== 'skill') return false
    // OpenCode skill IDs contain letters, numbers and dashes.
    const expression = pattern.replace(/[^a-z0-9*?-]/gi, '\\$&').replaceAll('*', '.*').replaceAll('?', '.')
    return new RegExp(`^${expression}$`).test(id)
  })?.action === 'allow'
}

function openCodeSkills(target) {
  const stage = mkdtempSync(join(tmpdir(), 'workflow-discovery-'))
  try {
    const output = join(stage, 'catalog.json')
    const descriptor = openSync(output, 'wx')
    try {
      // A regular file avoids the OpenCode CLI's truncated piped output.
      const catalog = command('opencode', ['--pure', 'debug', 'skill'], target, {
        stdio: ['ignore', descriptor, 'pipe'],
      })
      if (catalog.status !== 0) throw new Error('OpenCode could not list its skills.')
    } finally {
      closeSync(descriptor)
    }
    const agent = command('opencode', ['--pure', 'debug', 'agent', 'build'], target)
    if (agent.status !== 0) throw new Error('OpenCode could not report build-agent permissions.')
    const { permission } = JSON.parse(agent.stdout)
    if (!Array.isArray(permission)) throw new Error('OpenCode build-agent permissions are unavailable.')
    const catalog = JSON.parse(readFileSync(output, 'utf8'))
    return new Map(catalog.filter(({ name, location }) =>
      typeof name === 'string' && typeof location === 'string' && isAbsolute(location) &&
      permitted(permission, name)).map(({ name, location }) => [name, location]))
  } finally {
    rmSync(stage, { recursive: true, force: true })
  }
}

function codexSkills(target) {
  return new Promise((resolve, reject) => {
    const child = spawn('codex', ['app-server', '-c', 'mcp_servers={}', '--listen', 'stdio://'], {
      cwd: target, stdio: ['pipe', 'pipe', 'ignore'],
    })
    const lines = createInterface({ input: child.stdout })
    const timer = setTimeout(() => finish(new Error('Codex skill discovery timed out.')), 20_000)
    let settled = false

    function finish(error, skills) {
      if (settled) return
      settled = true
      clearTimeout(timer)
      lines.close()
      child.kill()
      if (error) reject(error)
      else resolve(skills)
    }
    function send(message) {
      child.stdin.write(JSON.stringify({ jsonrpc: '2.0', ...message }) + '\n')
    }

    child.once('error', () => finish(new Error('Cannot start Codex skill discovery.')))
    child.stdin.once('error', () => finish(new Error('Cannot query the Codex skill catalog.')))
    child.once('exit', () => finish(new Error('Codex closed its skill discovery interface.')))
    lines.on('line', (line) => {
      try {
        const { id, error, result } = JSON.parse(line)
        if (id !== 1 && id !== 2) return
        if (error) throw new Error('Codex did not provide its skill catalog.')
        if (id === 1) {
          send({ method: 'initialized' })
          send({ id: 2, method: 'skills/list', params: { cwds: [target] } })
          return
        }
        const catalog = result?.data?.[0]
        if (!Array.isArray(catalog?.skills) || catalog.errors?.length) {
          throw new Error('Codex reported one or more skill discovery errors.')
        }
        const skills = new Map()
        for (const { name, path, enabled } of catalog.skills) {
          if (enabled && typeof path === 'string' && isAbsolute(path) && !skills.has(name)) {
            skills.set(name, path)
          }
        }
        finish(null, skills)
      } catch {
        finish(new Error('Cannot read the Codex skill catalog.'))
      }
    })
    send({ id: 1, method: 'initialize', params: { clientInfo: { name: 'engineering-workflows', version: '0.1.0' } } })
  })
}

export async function discover(target) {
  const entries = await Promise.all(Object.keys(skillRoots).map(async (id) => {
    const binary = id === 'claude-code' ? 'claude' : id
    const version = command(binary, ['--version'], target)
    let reason
    if (version.error?.code === 'ENOENT') reason = `${binary} is not on PATH.`
    else if (version.status !== 0) reason = `${binary} did not respond to --version.`
    else if (id === 'pi' || id === 'claude-code') reason = 'Check skill discovery in the first harness session.'
    else {
      try {
        const skills = id === 'codex' ? await codexSkills(target) : openCodeSkills(target)
        return [id, { skills }]
      } catch {
        reason = 'Automatic discovery is unavailable. Check skills in the first harness session.'
      }
    }
    return [id, { skills: new Map(), reason }]
  }))
  return Object.fromEntries(entries)
}

function pythonCommand(target) {
  return [['python3'], ['python'], ['py', '-3']].find(([binary, ...args]) =>
    /^Python 3\./.test(command(binary, [...args, '--version'], target).stdout ?? ''))
}

function verifyRoles(target, harness, skills) {
  for (const role of roles) {
    const found = skills.get(role.id)
    if (!found) throw new Error(`${role.id} is missing or disabled in the harness catalog.`)
    const shared = join(target, '.agents/skills', role.id)
    const accepted = [join(shared, 'SKILL.md')]
    if (harness === 'opencode') accepted.push(join(target, '.claude/skills', role.id, 'SKILL.md'))
    if (!accepted.includes(realpathSync(found))) {
      throw new Error(`${role.id} resolves to ${found} instead of the installed workflow role.`)
    }
    checkSkill(shared, role)
  }
}

function verifyUiSearch(target, definition, python) {
  const directory = dirname(definition)
  const script = join(directory, 'scripts/search.py')
  const localRoots = ['.agents/skills', '.claude/skills'].map((root) => join(target, root, uiSkill.id))
  const pending = `Verify the UI UX Pro Max search in the harness session at ${definition}.`
  if (!localRoots.includes(directory)) return pending

  const body = readFileSync(definition, 'utf8')
  const advertised = /^python "([^"\r\n]+\/scripts\/search\.py)" "<query>" --domain <domain>\r?$/m.exec(body)?.[1]
  if (!advertised || resolve(target, advertised) !== script) {
    throw new Error(`UI UX Pro Max search command does not resolve to ${script} in ${definition}.`)
  }

  const stage = mkdtempSync(join(tmpdir(), 'workflow-ui-search-'))
  try {
    mkdirSync(join(stage, 'scripts'))
    mkdirSync(join(stage, 'data'))
    for (const [name, hash] of Object.entries(uiSkill.searchScripts)) {
      const path = join(directory, 'scripts', name)
      const code = readFileSync(path, 'utf8').replaceAll('\r\n', '\n')
      if (createHash('sha256').update(code).digest('hex') !== hash) return pending
      writeFileSync(join(stage, 'scripts', name), code, { flag: 'wx' })
    }
    const filename = 'data/ux-guidelines.csv'
    copyFileSync(join(directory, filename), join(stage, filename))
    const [binary, ...args] = python
    // Isolate imports to the verified scripts and the Python standard library.
    const invoke = 'import runpy,sys; from pathlib import Path; sys.argv=sys.argv[1:]; ' +
      'sys.path.insert(0,str(Path(sys.argv[0]).parent)); runpy.run_path(sys.argv[0],run_name="__main__")'
    const result = command(binary, [
      ...args, '-I', '-S', '-B', '-c', invoke, join(stage, 'scripts/search.py'),
      'keyboard', '--domain', 'ux', '--json',
    ], stage)
    if (result.status === 0) {
      try {
        const { results } = JSON.parse(result.stdout)
        if (Array.isArray(results) && results.length) return
      } catch {
        // Missing or malformed output is a failed search check.
      }
    }
    throw new Error(`UI UX Pro Max could not complete the search at ${script}.`)
  } finally {
    rmSync(stage, { recursive: true, force: true })
  }
}

function verifyHarness(target, harness, skills, python) {
  verifyRoles(target, harness, skills)
  for (const skill of prerequisites) {
    const definition = skills.get(skill.id)
    if (!definition) throw new Error(`${skill.id} is missing or disabled in the harness catalog.`)
    checkSkill(dirname(definition), skill)
  }
  if (command('graphify', ['--version'], target).status !== 0) {
    throw new Error('Graphify CLI is unavailable on PATH.')
  }
  return verifyUiSearch(target, skills.get(uiSkill.id), python)
}

export function reportReadiness(target, discovery, failures) {
  const python = pythonCommand(target)
  if (!python) {
    failures.push({ id: 'ui-ux-pro-max', harnesses: Object.keys(skillRoots), message: 'Python 3 is unavailable on PATH.' })
  }
  const marker = join(target, '.agents/skills/workflow-initiate/scripts/marker.mjs')
  const runMarker = (operation, ...ids) => command(process.execPath, [marker, operation, target, ...ids], target)
  const markerState = runMarker('show')
  const verified = []
  const reports = []
  let repairNeeded = markerState.status !== 0
  if (repairNeeded) console.error(markerState.stderr?.trim() || 'Cannot read the readiness marker.')

  for (const [id, { skills, reason }] of Object.entries(discovery)) {
    const affected = failures.filter(({ harnesses }) => harnesses.includes(id))
    if (affected.length || markerState.status !== 0) {
      const problem = affected.length ? affected.map(({ id }) => id).join(', ') : 'readiness marker'
      reports.push([id, `repair needed (${problem})`])
    } else if (reason) {
      reports.push([id, `pending. ${reason}`])
    } else {
      try {
        const pending = verifyHarness(target, id, skills, python)
        if (pending) reports.push([id, `pending. ${pending}`])
        else {
          verified.push(id)
          reports.push([id, 'ready'])
        }
      } catch (error) {
        repairNeeded = true
        reports.push([id, `repair needed. ${error.message}`])
      }
    }
  }
  if (verified.length) {
    const outcome = runMarker('record', ...verified)
    if (outcome.status !== 0) {
      repairNeeded = true
      console.error(outcome.stderr?.trim() || 'Cannot record readiness.')
      for (const report of reports) {
        if (report[1] === 'ready') report[1] = 'repair needed (readiness marker could not be updated)'
      }
    }
  }
  for (const [id, status] of reports) console.log(`${id}: ${status}`)
  for (const { id, harnesses, message } of failures) {
    console.error(`Repair ${id} (${harnesses.join(', ')}): ${message}`)
  }
  return failures.length > 0 || repairNeeded
}

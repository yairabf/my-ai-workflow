import { execFileSync } from 'node:child_process'
import { closeSync, mkdtempSync, openSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { posix, join } from 'node:path'
import { field } from '../mission/transitions.mjs'
import { checkHandoff } from './handoff.mjs'
import { roleSession } from './role-session.mjs'

function startWorkspace(docker, image, root, source, p) {
  const relative = posix.relative(root, p.workspace)
  if (!relative.startsWith('role-workspaces/') || relative.includes(','))
    throw new Error('Invalid workspace from builder.')
  const mount =
    'type=bind,src=' + posix.join(source, relative) + ',dst=' + p.workspace + (p.readonly ? ',readonly' : '')
  const identity = p.author
    ? [
        '-e',
        'GIT_AUTHOR_NAME=' + p.author.name,
        '-e',
        'GIT_COMMITTER_NAME=' + p.author.name,
        '-e',
        'GIT_AUTHOR_EMAIL=' + p.author.email,
        '-e',
        'GIT_COMMITTER_EMAIL=' + p.author.email,
      ]
    : []
  return docker([
    'run',
    '-d',
    '--rm',
    '--read-only',
    '--cap-drop=ALL',
    '--security-opt=no-new-privileges',
    '--tmpfs',
    '/tmp:mode=1777',
    '-e',
    'HOME=/tmp',
    ...identity,
    '-e',
    'GIT_CONFIG_COUNT=1',
    '-e',
    'GIT_CONFIG_KEY_0=safe.directory',
    '-e',
    'GIT_CONFIG_VALUE_0=' + p.workspace,
    '--mount',
    mount,
    '-w',
    p.workspace,
    '--entrypoint',
    'sleep',
    image,
    '900',
  ])
}

function copyBundle(docker, box, writer, writerStaging) {
  const temp = mkdtempSync(join(tmpdir(), 'ew-candidate-'))
  const file = join(temp, 'candidate.bundle')
  try {
    const fd = openSync(file, 'wx', 0o600)
    try {
      execFileSync('docker', ['exec', box, 'git', 'bundle', 'create', '-', 'HEAD'], {
        stdio: ['ignore', fd, 'inherit'],
      })
    } finally {
      closeSync(fd)
    }
    docker(['cp', file, writer + ':' + writerStaging + '/candidate.bundle'])
    docker(['exec', '-u', '0', writer, 'chown', 'openhands', writerStaging + '/candidate.bundle'])
  } finally {
    rmSync(temp, { recursive: true, force: true })
  }
}

export function checkoutReview(git, workspace, bundle, sha) {
  git(['init', '-q', workspace])
  git(['-C', workspace, 'fetch', '--no-tags', bundle, 'HEAD'])
  git(['-C', workspace, 'checkout', '--detach', sha])
}

function verifyStartingPoint(p, git) {
  if (['review', 'repair'].includes(p.stage) && git('rev-parse', 'HEAD') !== p.candidate)
    throw new Error('Workspace HEAD differs from the recorded candidate. Reconcile it before resuming.')
  if (['implementation', 'repair'].includes(p.stage)) {
    const expected = p.stage === 'repair' ? p.candidate : p.base
    if (
      git('branch', '--show-current') !== p.branch ||
      git('status', '--porcelain') ||
      (expected !== 'unborn' && git('rev-parse', 'HEAD') !== expected)
    )
      throw new Error('Implementation workspace changed. Inspect and reconcile the existing work before retrying.')
  }
}

export function validatedKind(p, git, document, url) {
  let kind = p.kind
  if (kind === 'brief' && /^## Question$/m.test(document)) kind = 'investigation-question'
  if (kind === 'brief') {
    const template = new URL(
      '../.agents/skills/workflow-investigate/references/investigation-brief.md',
      import.meta.url,
    )
    checkHandoff(document, readFileSync(template, 'utf8'), url, false)
    if (p.base !== 'unborn' && !document.includes(p.base))
      throw new Error('Brief must identify the inspected commit.')
  }
  if (kind === 'plan' && /^## Question$/m.test(document)) kind = 'planning-question'
  if (kind === 'plan') {
    const template = new URL('../.agents/skills/workflow-plan/references/implementation-plan.md', import.meta.url)
    checkHandoff(document, readFileSync(template, 'utf8'), url, true, p.briefName)
  }
  if (kind === 'repair' || kind === 'candidate') {
    const sha = git('rev-parse', 'HEAD')
    const start = kind === 'repair' ? p.candidate : p.base
    if (sha === start) throw new Error('No new candidate commit was produced. Resume to retry the developer session.')
    git('merge-base', '--is-ancestor', start, sha)
    if (
      git('status', '--porcelain') ||
      git('branch', '--show-current') !== p.branch ||
      field(document, 'Candidate commit') !== sha ||
      field(document, 'Worktree') !== p.workspace ||
      field(document, 'Branch') !== p.branch
    )
      throw new Error('Handoff differs from the observed candidate workspace.')
  }
  if (kind === 'review' && field(document, 'Base commit') !== p.base)
    throw new Error('Review did not identify the starting commit.')
  return kind
}

export async function drive({ docker, stage, writer, reader, staging, writerStaging, root, source, runRole = roleSession }) {
  const image = docker(['inspect', '--format', '{{.Image}}', reader])
  while (true) {
    const p = JSON.parse(stage(writer, 'packet'))
    if (!p.kind) return stage(writer, 'resume')
    let box
    try {
      if (p.reviewSource) {
        const input = startWorkspace(docker, image, root, source, { ...p, workspace: p.reviewSource })
        try {
          copyBundle(docker, input, writer, writerStaging)
        } finally {
          docker(['rm', '-f', input])
        }
        checkoutReview(
          (args) => docker(['exec', writer, 'git', ...args]),
          p.workspace,
          writerStaging + '/candidate.bundle',
          p.candidate,
        )
      }
      if (!p.refresh) box = startWorkspace(docker, image, root, source, p)
      const git = (...args) => docker(['exec', box, 'git', ...args])
      if (p.kind === 'delivery') {
        if (!p.refresh && git('rev-parse', 'HEAD') !== p.candidate)
          throw new Error('Delivery workspace differs from reviewed candidate.')
        if (!p.refresh) copyBundle(docker, box, writer, writerStaging)
        const status = stage(writer, 'deliver', { revision: p.revision })
        if (status.split('\n')[0].includes(' · delivery-head-changed · ')) continue
        return status
      }
      let document = p.captured
      if (document && ['candidate', 'repair'].includes(p.kind)) {
        const start = p.kind === 'repair' ? p.candidate : p.base
        if (git('rev-parse', 'HEAD') === start) document = undefined
      }
      if (!document) {
        verifyStartingPoint(p, git)
        document = await runRole(reader, staging, p.prompt, box)
        stage(writer, 'capture', { revision: p.revision, document })
      }
      const kind = validatedKind(p, git, document, p.url)
      console.error(stage(writer, 'result', { kind, revision: p.revision, document }))
    } catch (error) {
      const reason =
        typeof error.status === 'number' ? 'Builder operation failed with exit ' + error.status : error.message
      stage(writer, 'failure', { revision: p.revision, reason })
      throw new Error(p.stage + ' at revision ' + p.revision + ': ' + reason)
    } finally {
      if (box) docker(['rm', '-f', box])
      if (p.scratch) docker(['exec', writer, 'rm', '-rf', '--', posix.dirname(p.workspace)])
    }
  }
}

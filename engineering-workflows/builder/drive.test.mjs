import test from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { checkoutReview, drive, validatedKind } from './drive.mjs'
import { roleInputs } from './mission-role.mjs'

function temporary(t) {
  const root = mkdtempSync(join(tmpdir(), 'ew-check-'))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  return root
}

test('reviews committed files even when the developer directory contains local edits and ignored files', (t) => {
  const root = temporary(t)
  const git = (args) =>
    execFileSync('git', args, { cwd: root, stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8' }).trim()
  git(['init', '-q'])
  writeFileSync(join(root, '.gitignore'), 'generated\n')
  writeFileSync(join(root, 'app'), 'committed')
  git(['add', '.'])
  git(['-c', 'user.name=Test', '-c', 'user.email=test@localhost', 'commit', '-qm', 'Initial'])
  const sha = git(['rev-parse', 'HEAD'])
  writeFileSync(join(root, 'app'), 'changed')
  writeFileSync(join(root, 'generated'), 'leftover')
  const bundle = join(root, 'test.bundle')
  git(['bundle', 'create', bundle, 'HEAD'])
  const workspace = join(root, 'review')
  checkoutReview(git, workspace, bundle, sha)
  assert.equal(readFileSync(join(workspace, 'app'), 'utf8'), 'committed')
  assert.equal(existsSync(join(workspace, 'generated')), false)
  assert.equal(git(['-C', workspace, 'rev-parse', 'HEAD']), sha)
})

test('investigation requires documented findings with evidence and the starting revision', () => {
  const url = 'https://github.com/test/demo/issues/1',
    base = 'a'.repeat(40)
  const p = { kind: 'brief', base }
  const brief = [
    url,
    '## Mission',
    'Test',
    '## Repository context',
    base,
    '## Verified findings',
    '- **Finding:** No tests\n  - **Evidence:** git ls-files returned no files.',
    '## Assumptions',
    'None',
    '## Open questions and evidence gaps',
    'None',
    '## Skipped checks',
    'None',
  ].join('\n')
  assert.equal(validatedKind(p, null, brief, url), 'brief')
  for (const bad of [brief.replace(base, 'unknown'), brief.replace('**Evidence:**', '**Unverified:**')])
    assert.throws(() => validatedKind(p, null, bad, url))
})

test('repair receives saved operator instructions', (t) => {
  const root = temporary(t),
    store = { artifact: (name) => join(root, name) }
  for (const name of ['mission', 'approved', 'candidate', 'review', 'decision'])
    writeFileSync(store.artifact(name), name === 'decision' ? 'Keep the older schema' : name)
  const prompt = roleInputs(
    {
      stage: 'repair',
      file: 'mission',
      notes: [{ kind: 'continue', file: 'decision' }],
      plans: [{ approved: 'approved' }],
      candidates: [{ file: 'candidate', reviews: [{ file: 'review' }] }],
    },
    store,
  )
  assert.match(prompt, /Keep the older schema/)
})

test('failed workspace launch records the revision and cleans the scratch directory', async () => {
  const calls = []
  const docker = (args) => {
    calls.push(args)
    if (args[0] === 'run') throw Error('launch failed')
    return 'image'
  }
  const stage = (_writer, op, data) => {
    calls.push([op, data])
    return JSON.stringify({
      workspace: '/root/role-workspaces/session/checkout',
      scratch: true,
      kind: 'brief',
      stage: 'investigation',
      revision: 2,
    })
  }
  await assert.rejects(drive({ docker, stage, writer: 'writer', root: '/root', source: '/host' }), /launch failed/)
  assert.deepEqual(calls.at(-1), ['exec', 'writer', 'rm', '-rf', '--', '/root/role-workspaces/session'])
  assert.deepEqual(calls.at(-2), ['failure', { revision: 2, reason: 'launch failed' }])
})

test('unchanged PR refresh needs no workspace container or bundle', async () => {
  const calls = []
  const result = await drive({
    docker: (args) => {
      calls.push(args[0])
      return 'image'
    },
    stage: (_writer, op) =>
      op === 'packet' ? JSON.stringify({ kind: 'delivery', refresh: true, revision: 9 }) : 'delivery status',
  })
  assert.equal(result, 'delivery status')
  assert.deepEqual(calls, ['inspect'])
})

test('planner must complete the template and name the saved investigation brief', () => {
  const url = 'https://github.com/example/demo/issues/7',
    briefName = 'brief-' + 'a'.repeat(64) + '.md'
  const template = readFileSync(
    new URL('../.agents/skills/workflow-plan/references/implementation-plan.md', import.meta.url),
    'utf8',
  )
  const incomplete = template
    .replace(/<original file or source reference and target repository>/, url)
    .replace(/<file reference and inspected revision, if known>/, briefName)
  const p = { kind: 'plan', briefName }
  assert.throws(() => validatedKind(p, null, incomplete, url), /placeholders/)
  const complete = incomplete.replace(/<[^<>]+>/g, 'Document the repository test command.')
  assert.equal(validatedKind(p, null, complete, url), 'plan')
  assert.throws(() => validatedKind(p, null, complete.replace(briefName, 'brief.md'), url), /reference the brief/)
})

test('operator reconciles a rejected captured handoff at the same revision before resume', async (t) => {
  const { openStore } = await import('../mission/store.mjs')
  const { fileURLToPath } = await import('node:url')
  const root = temporary(t),
    url = 'https://github.com/example/demo/issues/7'
  const store = openStore(join(root, 'mission-state'), process.cwd(), true)
  const artifact = (kind) => store.saveArtifact(kind, url + '\n' + kind)
  const approved = artifact('approved-plan'),
    sha = 'a'.repeat(40),
    branch = 'workflow/issue-7'
  const workspace = join(root, 'role-workspaces', 'implementation')
  const stage = (op, data) =>
    execFileSync(
      process.execPath,
      [fileURLToPath(new URL('./stage.mjs', import.meta.url)), op, root, 'example/demo', '7'],
      { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'], input: JSON.stringify(data) },
    ).trim()
  store.save(1, 'a'.repeat(64), {
    repository: 'example/demo',
    number: 7,
    file: artifact('mission'),
    stage: 'implementation',
    notes: [],
    plans: [{ file: artifact('plan'), approved }],
    candidates: [],
    delivery: [],
    failedRepairs: 0,
    round: 0,
    brief: artifact('brief'),
    ready: { file: artifact('ready'), base: 'main', checkout: root },
  })
  stage('capture', { revision: 1, document: url })
  const packet = {
    kind: 'candidate',
    workspace,
    branch,
    base: 'b'.repeat(40),
    stage: 'implementation',
    revision: 1,
    url,
  }
  const run = () =>
    drive({
      writer: 'writer',
      root,
      source: '/host',
      docker: (args) => (args.includes('rev-parse') ? sha : args.includes('branch') ? branch : ''),
      stage: (_writer, op, data) => {
        if (op === 'packet') {
          if (store.revisions()[0] === 2) return '{}'
          const name = readFileSync(join(store.root, 'role-result-1'), 'utf8')
          return JSON.stringify({ ...packet, captured: readFileSync(store.artifact(name), 'utf8') })
        }
        if (op === 'resume') return store.read(2).mission.stage
        return stage(op, data)
      },
    })
  await assert.rejects(run(), /Candidate commit/)
  const document = [
    url,
    '**Target:** example/demo',
    '**Approved plan:** ' + approved,
    '**Branch:** ' + branch,
    '**Worktree:** ' + workspace,
    '**Candidate commit:** ' + sha,
    '## Verification',
    'Tests passed.',
  ].join('\n')
  assert.throws(() => stage('operator', { command: 'recover-handoff', revision: 2, document }), /current revision/)
  stage('operator', { command: 'recover-handoff', revision: 1, document })
  assert.equal(await run(), 'review')
})

test('recovers a second changed head and cleans scratch storage on packet failure', async (t) => {
  const { openStore } = await import('../mission/store.mjs')
  const { fileURLToPath } = await import('node:url')
  const { readdirSync, mkdirSync } = await import('node:fs')
  const root = temporary(t)
  const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim()
  git('init', '-qb', 'main')
  const commit = (title) => {
    git('-c', 'user.name=Test', '-c', 'user.email=test@example.invalid', 'commit', '-qm', title, '--allow-empty')
    return git('rev-parse', 'HEAD')
  }
  const original = commit('original'),
    first = commit('first'),
    latest = commit('second')
  git('update-ref', 'refs/pull/1/head', latest)
  const config = join(root, 'gitconfig')
  git('config', '--file', config, 'url.' + root + '.insteadOf', 'https://github.com/example/demo.git')
  const bin = join(root, 'bin')
  mkdirSync(bin)
  writeFileSync(join(bin, 'gh'), '#!/bin/sh\necho ' + latest + '\n', { mode: 0o700 })
  const store = openStore(join(root, 'mission-state'), process.cwd(), true)
  const art = (k) => store.saveArtifact(k, k)
  const ready = store.saveArtifact('ready', '**Starting commit:** ' + original)
  store.save(1, 'a'.repeat(64), {
    stage: 'delivery-head-changed',
    repository: 'example/demo',
    number: 7,
    file: art('mission'),
    brief: art('brief'),
    plans: [{ file: art('plan'), approved: art('approved-plan') }],
    ready: { file: ready, base: 'main', checkout: root },
    notes: [],
    round: 0,
    failedRepairs: 0,
    candidates: [
      {
        file: art('candidate'),
        sha: original,
        evidence: art('checks'),
        reviews: [],
        round: 0,
        branch: 'workflow/issue-7',
      },
    ],
    delivery: [
      { file: art('delivery'), head: first, pr: 'https://github.com/example/demo/pull/1', changed: true },
    ],
  })
  const run = (op) =>
    execFileSync(
      process.execPath,
      [fileURLToPath(new URL('./stage.mjs', import.meta.url)), op, root, 'example/demo', '7'],
      {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
        env: { ...process.env, PATH: bin + ':' + process.env.PATH, GIT_CONFIG_GLOBAL: config },
      },
    )
  // No Thermo skill in this fixture. The packet fails after recording the correct review target.
  assert.throws(() => run('packet'))
  const saved = store.read(3)
  assert.equal(saved.mission.stage, 'review')
  assert.equal(saved.mission.candidates.at(-1).sha, latest)
  assert.equal(saved.mission.delivery.at(-1).head, latest)
  assert.match(run('resume'), /Last failed attempt:[\s\S]*thermo/i)
  const sessions = readdirSync(join(root, 'role-workspaces', ready))
  assert.equal(sessions.length, 1)
  assert.match(sessions[0], /^pr-head-/)
})

test('builder sends normalized Windows Markdown for disposition, recovery and clarification', async t => {
  const {fileURLToPath} = await import('node:url')
  const root = temporary(t)
  const input = join(root, 'operator.md')
  const document = 'https://github.com/example/demo/issues/7\n\n## Evidence\nBoth tests passed.\n'
  writeFileSync(input, document.replaceAll('\n','\r\n'))
  writeFileSync(join(root, 'docker'), `#!/usr/bin/env node
const args=process.argv.slice(2)
if(args[0]==='inspect') console.log(JSON.stringify([{Type:'bind',RW:args.at(-1)==='writer',Source:'/host',Destination:'/projects'}]))
else if(args.includes('mktemp')) console.log('/tmp/ew-builder.fixture')
else if(args.includes('operator')) process.stdout.write(require('node:fs').readFileSync(0))
`, {mode:0o700})
  for (const action of ['delivery','recover-handoff','clarification']) {
    const output = execFileSync(process.execPath,[fileURLToPath(new URL('../builder-plan.mjs',import.meta.url)),
      action,'example/demo','7',input,'3'],{encoding:'utf8',env:{...process.env,EW_BUILDER_WRITER:'writer',
        EW_BUILDER_READER:'reader',PATH:root+':'+process.env.PATH}})
    assert.equal(JSON.parse(output).document,document)
  }
})

test('unchanged implementation and repair commits require a fresh developer session on retry', async () => {
  for (const kind of ['candidate', 'repair']) {
    const branch = 'workflow/issue-7', workspace = '/root/role-workspaces/implementation'
    const packet = { kind, stage: kind === 'repair' ? 'repair' : 'implementation', branch, workspace,
      revision: 3, base: 'b'.repeat(40), candidate: 'c'.repeat(40) }
    let head = kind === 'repair' ? packet.candidate : packet.base
    let sessions = 0, recorded = false
    const run = () => drive({
      root: '/root', source: '/host',
      docker: args => args.includes('rev-parse') ? head : args.includes('branch') ? branch : '',
      stage: (_writer, op, data) => {
        if (op === 'packet') return JSON.stringify(recorded ? {} : packet)
        if (op === 'capture') packet.captured = data.document
        if (op === 'result') recorded = true
        return op
      },
      runRole: () => {
        if (++sessions === 2) head = 'd'.repeat(40)
        return ['**Candidate commit:** ' + head, '**Branch:** ' + branch, '**Worktree:** ' + workspace].join('\n')
      },
    })
    await assert.rejects(run(), /No new candidate commit/)
    assert.equal(recorded, false)
    assert.ok(packet.captured)
    assert.equal(await run(), 'resume')
    assert.equal(sessions, 2)
    assert.equal(recorded, true)
  }
})

test('workspace reports the exit status for passing and failing commands with identical verbose logs', async t => {
  const { roleSession } = await import('./role-session.mjs')
  const root = temporary(t)
  // Stand in for the reader's Pi session and the workspace Docker invocation.
  writeFileSync(join(root, 'docker'), `#!/bin/sh
case "$3" in
  reader)
    if [ "$4" = sh ]; then cat >/dev/null; exit 0; fi
    printf '{"command":"run"}\\n'
    IFS= read -r reply
    node -e 'console.log(JSON.stringify({result:JSON.parse(process.argv[1]).output}))' "$reply"
    ;;
  sh)
    node -e 'process.stdout.write("x".repeat(25000))'
    exit "$2"
    ;;
esac
`, { mode: 0o700 })
  const previousPath = process.env.PATH
  t.after(() => { process.env.PATH = previousPath })
  process.env.PATH = root + ':' + previousPath
  for (const code of ['0', '1']) {
    const output = await roleSession('reader', root, 'Run the checks', code)
    assert.equal(output, 'exit ' + code + '\n[output truncated]\n' + 'x'.repeat(24000))
  }
})

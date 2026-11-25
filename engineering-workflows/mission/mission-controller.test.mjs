import assert from 'node:assert/strict'
import { spawn, spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const cli = fileURLToPath(new URL('../mission-controller.mjs', import.meta.url))
const issue = 'https://github.com/example/demo/issues/7'
const commits = 'abcde'.split('').map((char) => char.repeat(40))

function fixture(t) {
  const dir = mkdtempSync(join(tmpdir(), 'ew-mission-'))
  t.after(() => rmSync(dir, { recursive: true, force: true }))
  const state = join(dir, 'mission-state')
  const target = join(dir, 'checkout')
  const worktree = join(dir, 'worktree')
  mkdirSync(target)
  mkdirSync(worktree)
  let revision = 0
  let index = 0
  function file(text) {
    const path = join(dir, 'input-' + ++index + '.md')
    writeFileSync(path, issue + '\n\n' + text + '\n')
    return path
  }
  function raw(args, options = []) {
    return spawnSync(process.execPath, [...options, cli, '--state', state, ...args], { encoding: 'utf8' })
  }
  function accept(args, stage) {
    const result = raw(['--at', String(revision), ...args])
    assert.equal(result.status, 0, result.stderr)
    assert.ok(result.stdout.includes(' · ' + stage + ' · revision ' + ++revision), result.stdout)
    return result.stdout
  }
  function record(kind, input, stage) {
    return accept(['record', kind, file(input)], stage)
  }
  function reject(kind, input, expected) {
    const result = raw(['--at', String(revision), 'record', kind, file(input)])
    assert.equal(result.status, 1)
    assert.match(result.stderr, expected)
  }
  const setup = '# Readiness\n\n**Checkout:** ' + target + '\n**Base branch:** main\n\n## Readiness\n\nInitiate verified.'
  const mission = file('Goal: Show a fixture option in help.\n\nAcceptance: Help lists the option.')
  const submit = ['submit', 'example/demo', '7', mission]
  function saved(prefix) {
    return readdirSync(state).find((name) => name.startsWith(prefix + '-') && name.endsWith('.md'))
  }
  return { dir, state, target, worktree, raw, accept, record, reject, setup, submit, saved, file, get revision() { return revision } }
}

function prepare(f) {
  f.accept(f.submit, 'preparation')
  f.record('ready', f.setup, 'investigation')
  f.record('brief', '# Investigation brief\n\n## Mission\n\nCLI help.\n\n## Repository context\n\nmain.\n\n## Verified findings\n\nThe help omits the option.', 'planning')
  f.record('clarification', '# Clarification\n\nHelp must list the option value.', 'planning')
  return [
    '# Implementation plan',
    '## Mission and evidence\n\nUse ' + f.saved('brief') + '.',
    '## Planned changes\n\nUpdate help.',
    '## Acceptance criteria\n\nHelp lists the option.',
    '## Verification\n\nRun the CLI help command.',
    '## Human approval\n\n**Decision:** Pending',
  ].join('\n\n')
}

function filename(output, label) {
  const match = output.match(new RegExp('^' + label + ': (.+)$', 'm'))
  assert.ok(match, output)
  return match[1].split('/').at(-1)
}

function implementation(f, revision, commit, repairDetails = '') {
  return [
    '# Implementation handoff',
    '**Approved plan** — ' + revision,
    '**Target:** example/demo',
    '**Branch:** feature/help',
    '**Worktree:** ' + f.worktree,
    '**Candidate commit** — ' + commit,
    '## Tasks\n\nPrivate developer notes.',
    repairDetails,
    '## Verification\n\nnode cli.mjs --help returned the option.',
  ].join('\n\n')
}

function review(revision, commit, outcome, details = '') {
  return [
    '# Independent review',
    '**Mission and approved plan** — ' + revision,
    '**Target and base:** example/demo',
    '**Base branch:** main',
    '**Base commit:** ' + commits[4],
    '**Candidate** — ' + commit,
    '**Verdict** — ' + outcome,
    details,
    '## Acceptance criteria\n\nObserved the exact candidate.',
    '## Thermo review and required changes\n\nFindings are in the verdict.',
  ].join('\n\n')
}

function deliver(commit, ci, advisory) {
  return [
    '# GitHub delivery',
    '**PR:** https://github.com/example/demo/pull/8',
    '**Head:** ' + commit,
    '**CI:** ' + ci,
    '**Advisory review:** ' + advisory,
    '## Evidence\n\nFixture check results.',
  ].join('\n\n')
}

test('recovers the same mission, rejects competing creation, and ignores an interrupted transition', async (t) => {
  const f = fixture(t)
  const run = (args) => new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [cli, '--state', f.state, ...args], { stdio: 'ignore' })
    child.on('error', reject)
    child.on('close', resolve)
  })
  const second = ['submit', 'example/other', '7', f.file('Goal: other mission.')]
  const winners = await Promise.all([run(f.submit), run(second)])
  assert.deepEqual(winners.toSorted(), [0, 1])
  const firstMission = winners[0] === 0 ? f.submit : second
  const first = f.raw(['status', firstMission[1], '7'])
  assert.match(first.stdout, /preparation · revision 1/)
  const replay = f.raw(firstMission)
  assert.equal(replay.status, 0, replay.stderr)
  assert.match(replay.stdout, /Already accepted at revision 1/)
  assert.match(f.raw(['status']).stdout, /preparation · revision 1/)
  assert.equal(f.raw(['--at', '1', ...second]).status, 1)

  const hook = join(f.dir, 'interrupt.mjs')
  writeFileSync(hook, `
    import fs from 'node:fs'
    import { syncBuiltinESMExports } from 'node:module'
    const link = fs.linkSync
    fs.linkSync = (source, destination) => {
      if (destination.endsWith('/mission-2.json')) process.exit(79)
      return link(source, destination)
    }
    syncBuiltinESMExports()
  `)
  const ready = f.setup.replace('Initiate verified.',
    'Initiate verified for https://github.com/' + firstMission[1] + '/issues/7.')
  const args = ['--at', '1', 'record', 'ready', f.file(ready)]
  assert.equal(f.raw(args, ['--import', hook]).status, 79)
  assert.match(f.raw(['status']).stdout, /preparation · revision 1/)
  assert.match(f.raw(args).stdout, /investigation · revision 2/)
  assert.match(f.raw(args).stdout, /Already accepted at revision 2/)
  writeFileSync(join(f.state, 'mission-2.json'), '{broken')
  assert.match(f.raw(['status']).stderr, /Invalid mission state at revision 2/)
})

test('requires approval of the current revision and fresh review when the PR head changes', (t) => {
  const f = fixture(t)
  const plan = prepare(f)
  const draft = filename(f.record('plan', plan, 'approval'), 'Pending plan')
  f.record('plan-feedback', 'Clarify the example.', 'planning')
  const restoredPlanning = f.raw(['status']).stdout
  assert.equal(filename(restoredPlanning, 'Plan draft to revise'), draft)
  assert.match(restoredPlanning, /Plan feedback:/)
  assert.match(restoredPlanning, /Investigation brief:/)
  assert.equal(filename(f.record('plan', plan, 'approval'), 'Pending plan'), draft)
  f.record('plan-feedback', 'Revise the example now.', 'planning')
  const pending = filename(f.record('plan', plan.replace('Update help.', 'Update help and clarify it.'), 'approval'), 'Pending plan')
  f.reject('candidate', implementation(f, pending, commits[0]), /during approval/)
  f.accept(['approve', pending], 'implementation')
  const firstApproval = f.saved('approved-plan')
  const revised = filename(f.record('plan', plan.replace('Update help.', 'Update help and its example.'), 'approval'), 'Pending plan')
  assert.match(f.raw(['--at', String(f.revision), 'approve', pending]).stderr, /current pending plan/)
  const approved = filename(f.accept(['approve', revised], 'implementation'), 'Approved plan')
  assert.notEqual(approved, firstApproval)
  assert.match(readFileSync(join(f.state, approved), 'utf8'), /\*\*Decision:\*\* Approved/)
  assert.match(f.raw(['status']).stdout, new RegExp(approved))
  f.reject('candidate', implementation(f, firstApproval, commits[0]), /current approved plan/)
  const ambiguous = firstApproval + ' (also ' + approved + ')'
  f.reject('candidate', implementation(f, ambiguous, commits[0]), /exactly one approved plan/)
  for (const base of ['main', 'refs/heads/main']) {
    f.reject('candidate', implementation(f, approved, commits[0]).replace('**Branch:** feature/help', '**Branch:** ' + base), /dedicated branch/)
  }
  const alias = join(f.dir, 'checkout-alias')
  symlinkSync(f.target, alias, 'dir')
  for (const checkout of [f.target, f.target + '/.', alias]) {
    f.reject('candidate', implementation(f, approved, commits[0]).replace(f.worktree, checkout), /dedicated implementation worktree/)
  }
  const input = f.record('candidate', implementation(f, approved, commits[0]), 'review')
  const evidence = filename(input, 'Test evidence')
  assert.doesNotMatch(readFileSync(join(f.state, evidence), 'utf8'), /Private developer notes/)
  f.reject('review', review(approved, commits[1], 'Pass — fixture passed'), /exact current candidate SHA/)
  f.reject('review', review(ambiguous, commits[0], 'Pass — fixture passed'), /exactly one approved plan/)
  f.record('review', review(approved, commits[0], 'Pass — fixture passed'), 'delivery')
  f.record('delivery', deliver(commits[0], 'Failed', 'Pending'), 'delivery')
  f.record('delivery', deliver(commits[1], 'Passed', 'Resolved'), 'delivery-head-changed')
  f.reject('delivery', deliver(commits[0], 'Passed', 'Resolved'), /during delivery-head-changed/)
  f.reject('candidate', implementation(f, approved, commits[2]), /newly reported PR head/)
  f.record('head-changed', deliver(commits[0], 'Passed', 'Resolved'), 'delivery-head-changed')
  f.reject('candidate', implementation(f, approved, commits[1]), /newly reported PR head/)
  const returned = f.record('candidate', implementation(f, approved, commits[0]), 'review')
  assert.doesNotMatch(returned, /Review \(Pass\)/)
  f.record('review', review(approved, commits[0], 'Pass — reviewed the returned head'), 'delivery')
  f.record('head-changed', deliver(commits[1], 'Pending', 'Pending'), 'delivery-head-changed')
  f.record('head-changed', deliver(commits[2], 'Pending', 'Pending'), 'delivery-head-changed')
  f.reject('candidate', implementation(f, approved, commits[1]), /newly reported PR head/)
  f.record('candidate', implementation(f, approved, commits[2]), 'review')
  f.record('review', review(approved, commits[2], 'Pass — reviewed the new head'), 'delivery')
  f.reject('delivery', deliver(commits[0], 'Passed', 'Resolved'), /superseded candidate SHA/)
  f.record('delivery', deliver(commits[2], 'Passed', 'Resolved'), 'delivered')
  assert.match(f.raw(['status']).stdout, /CI: Passed · Advisory review: Resolved/)
  f.record('head-changed', deliver(commits[0], 'Passed', 'Resolved'), 'delivery-head-changed')
  f.reject('delivery', deliver(commits[0], 'Passed', 'Resolved'), /during delivery-head-changed/)
  f.record('candidate', implementation(f, approved, commits[0]), 'review')
  f.record('head-changed', deliver(commits[1], 'Pending', 'Pending'), 'delivery-head-changed')
  f.record('candidate', implementation(f, approved, commits[1]), 'review')
  const blocked = f.record('review', review(approved, commits[1], 'Blocked — need verification'), 'review-blocked')
  assert.match(blocked, /Unsuccessful repairs: 0/)
  f.record('head-changed', deliver(commits[0], 'Pending', 'Pending'), 'delivery-head-changed')
  f.reject('review', review(approved, commits[1], 'Pass — superseded head'), /during delivery-head-changed/)
  const freshReview = f.record('candidate', implementation(f, approved, commits[0]), 'review')
  assert.doesNotMatch(freshReview, /Review \(Pass\)/)
  assert.match(freshReview, /Unsuccessful repairs: 0/)
  const freshDelivery = f.record('review', review(approved, commits[0], 'Pass — reviewed the returning head'), 'delivery')
  assert.doesNotMatch(freshDelivery, /CI: Passed/)
  f.record('delivery', deliver(commits[0], 'Passed', 'Resolved'), 'delivered')
  f.accept(['submit', 'example/new', '7', f.file('New goal.')], 'preparation')
  assert.match(f.raw(['status', 'example/demo', '7']).stdout, /Historical record/)
})

test('preserves blocked reviews and counts only completed unsuccessful repairs', (t) => {
  const f = fixture(t)
  const pending = filename(f.record('plan', prepare(f), 'approval'), 'Pending plan')
  const approved = filename(f.accept(['approve', pending], 'implementation'), 'Approved plan')
  f.record('candidate', implementation(f, approved, commits[0]), 'review')
  let output = f.record('review', review(approved, commits[0], 'Changes requested — add an example'), 'repair')
  assert.match(output, /Unsuccessful repairs: 0/)
  for (const round of [1, 2]) {
    const requested = filename(output, 'Outstanding findings')
    const repair = f.record('repair', implementation(f, approved, commits[round],
      '## Repair details\n\nFollowing ' + requested + ' for ' + commits[round - 1] + '.'), 'review')
    const repairReference = filename(repair, 'Repair handoff reference')
    const details = '## Repair review\n\nReviewed ' + repairReference + ' for ' + requested + '.'
    if (round === 1) {
      const blockedReport = review(approved, commits[round], 'Blocked — need help output', details)
      const blocked = f.record('review', blockedReport, 'review-blocked')
      assert.match(blocked, /Unsuccessful repairs: 0/)
      f.record('evidence', '**Candidate:** ' + commits[round] + '\n\nPartial help output attached.', 'review')
      const stillBlocked = f.record('review', blockedReport, 'review-blocked')
      assert.match(stillBlocked, /Unsuccessful repairs: 0/)
      f.record('evidence', '**Candidate:** ' + commits[round] + '\n\nHelp output attached.', 'review')
      assert.equal((f.raw(['status']).stdout.match(/Review \(Blocked\)/g) ?? []).length, 2)
    }
    const body = f.file(review(approved, commits[round], 'Changes requested — example still missing', details))
    const at = String(f.revision)
    output = f.accept(['record', 'review', body], round === 1 ? 'repair' : 'repair-paused')
    assert.match(output, new RegExp('Unsuccessful repairs: ' + round))
    assert.match(f.raw(['--at', at, 'record', 'review', body]).stdout, /Already accepted/)
  }
  assert.match(output, new RegExp('Repair 1 candidate: ' + commits[1]))
  assert.match(output, new RegExp('Repair 2 candidate: ' + commits[2]))
  assert.match(output, /Outstanding findings/)
  f.reject('repair', implementation(f, approved, commits[3]), /during repair-paused/)
  f.record('continue', 'Operator authorizes one more repair.', 'repair')
})

test('resumes investigation only with an answer to its saved question', t => {
  const f = fixture(t)
  f.accept(f.submit, 'preparation')
  f.record('ready', f.setup, 'investigation')
  f.record('investigation-question', '## Findings\nNo application code.\n## Question\nWhich cloud?\n## Why it matters\nThe deployment target changes the plan.', 'investigation-waiting')
  f.reject('brief', 'premature brief', /during investigation-waiting/)
  const question = f.saved('investigation-question')
  f.reject('investigation-answer', '## Answer\nAzure', /current investigation question/)
  const status = f.record('investigation-answer', question + '\n## Answer\nAzure', 'investigation')
  assert.ok(status.includes('Operator answer:'))
})

test('planner questions survive restart and resume with the linked operator answer', async t => {
  const {validatedKind} = await import('../builder/drive.mjs')
  const {roleInputs} = await import('../builder/mission-role.mjs')
  const {openStore} = await import('./store.mjs')
  const f = fixture(t)
  const plan = prepare(f)
  const question = '## Question\nShould help show examples?\n## Why it matters\nThis changes scope.'
  const kind = validatedKind({kind:'plan'}, null, issue+'\n'+question, issue)
  const status = f.record(kind, question, 'planning-waiting')
  const name = filename(status, 'Planner question')
  assert.match(f.raw(['status']).stdout, /planning-waiting/)
  f.reject('plan', plan, /during planning-waiting/)
  f.reject('clarification', '## Answer\nInclude examples.', /current planning question/)
  f.record('clarification', name+'\r\n## Answer\r\nInclude examples.', 'planning')
  const store = openStore(f.state, process.cwd(), false)
  const inputs = roleInputs(store.read(f.revision).mission,store)
  assert.ok(inputs.includes('Should help show examples?') && inputs.includes('Include examples.'))
  f.record('plan', plan, 'approval')
})

test('builder records identical CI evidence after fresh review and deduplicates later refreshes', async t => {
  const { deliver: builderDelivery } = await import('../builder/mission-role.mjs')
  const f = fixture(t)
  const pending = filename(f.record('plan', prepare(f), 'approval'), 'Pending plan')
  const approved = filename(f.accept(['approve', pending], 'implementation'), 'Approved plan')
  f.record('candidate', implementation(f, approved, commits[0]), 'review')
  f.record('review', review(approved, commits[0], 'Pass — verified'), 'delivery')
  const evidence = deliver(commits[1], 'Passed', 'Resolved')
  f.record('head-changed', evidence, 'delivery-head-changed')
  f.record('candidate', implementation(f, approved, commits[1]), 'review')
  f.record('review', review(approved, commits[1], 'Pass — verified again'), 'delivery')
  const publish = () => ({ kind: 'delivery', document: readFileSync(join(f.state, f.saved('delivery')), 'utf8') })
  const refresh = revision => builderDelivery(f.dir, {repository:'example/demo', number:7}, {revision}, publish)
  const status = refresh(f.revision)
  assert.match(status, /PR: https:\/\/github.com\/example\/demo\/pull\/8/)
  assert.match(status, /CI: Passed · Advisory review: Resolved/)
  assert.match(status, /Next: .*merge/i)
  assert.equal(refresh(f.revision + 1), status)
})

test('resuming an approved empty repository revisits investigation and approval on its initial commit', async t => {
  const { execFileSync } = await import('node:child_process')
  const { missionPacket } = await import('../builder/mission-role.mjs')
  const { openStore } = await import('./store.mjs')
  const f = fixture(t)
  const key = { repository: 'example/demo', number: 7 }
  const git = (...args) => execFileSync('git', args, { cwd: f.target, encoding: 'utf8' }).trim()
  git('init', '-qb', 'main')
  f.setup += '\n**Starting commit:** unborn'
  const pending = filename(f.record('plan', prepare(f), 'approval'), 'Pending plan')
  f.accept(['approve', pending], 'implementation')
  const packet = () => missionPacket(f.dir, key)
  assert.throws(packet, /Initialize and publish branch main/)
  git('-c', 'user.name=Test', '-c', 'user.email=test@example.invalid', 'commit', '--allow-empty', '-qm', 'Initialize')
  const head = git('rev-parse', 'HEAD')
  const next = packet()
  assert.equal(next.stage, 'investigation')
  assert.equal(next.base, head)
  assert.equal(next.revision, f.revision + 1)
  assert.equal(packet().revision, next.revision)
  assert.equal(execFileSync('git', ['-C', next.workspace, 'rev-parse', 'HEAD'], {encoding:'utf8'}).trim(), head)
  const store = openStore(f.state, process.cwd(), false)
  const { mission } = store.read(next.revision)
  assert.deepEqual(mission.plans, [])
  assert.equal(mission.brief, undefined)
  assert.ok(next.prompt.includes('Help must list the option value.'))
  assert.equal(f.raw(['approve', pending, '--at', String(next.revision)]).status, 1)
  assert.ok(store.read(f.revision).mission.plans[0].approved)
  const original = store.read(f.revision).mission
  const oldBrief = readFileSync(store.artifact(original.brief), 'utf8')
  const oldPlan = readFileSync(store.artifact(pending), 'utf8')
  const submitAt = (revision, ...args) => {
    const result = f.raw(['--at', String(revision), ...args])
    assert.equal(result.status, 0, result.stderr)
    return result.stdout
  }
  submitAt(next.revision, 'record', 'brief', f.file(oldBrief + '\nInspected ' + head))
  const newBrief = store.read(next.revision + 1).mission.brief
  const awaiting = submitAt(next.revision + 1, 'record', 'plan', f.file(oldPlan.replace(original.brief, newBrief)))
  const newPlan = filename(awaiting, 'Pending plan')
  assert.notEqual(newPlan, pending)
  assert.match(submitAt(next.revision + 2, 'approve', newPlan), / · implementation · /)
})

import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, writeFileSync, readFileSync, mkdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import test from 'node:test'
import { publishCandidate } from './delivery.mjs'

test('publishes only the reviewed bundle, recovers the same PR and detects a moved head', (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'ew-delivery-test-'))
  t.after(() => rmSync(dir, { recursive: true, force: true }))
  const git = (...args) => execFileSync('git', args, { cwd: dir, encoding: 'utf8' }).trim()
  git('init', '-q', '-b', 'main')
  git('-c', 'user.name=Test', '-c', 'user.email=test@example.invalid', 'commit', '-qm', 'base', '--allow-empty')
  const base = git('rev-parse', 'HEAD')
  git('switch', '-qc', 'workflow/issue-7')
  git(
    '-c',
    'user.name=Test',
    '-c',
    'user.email=test@example.invalid',
    'commit',
    '-qm',
    'candidate',
    '--allow-empty',
  )
  const sha = git('rev-parse', 'HEAD')
  const remote = join(dir, 'remote.git')
  git('init', '--bare', '-q', remote)
  const bundle = join(dir, 'candidate.bundle')
  git('bundle', 'create', bundle, 'HEAD')
  const bin = join(dir, 'bin')
  mkdirSync(bin)
  const gh = join(bin, 'gh')
  const pr = join(dir, 'pr.json')
  const url = 'https://github.com/example/demo/pull/1'
  const details = {
    url,
    headRefOid: sha,
    headRepositoryOwner: { login: 'example' },
    headRepository: { name: 'demo' },
    state: 'OPEN',
    statusCheckRollup: [{ name: 'verify', conclusion: 'SUCCESS' }],
  }
  writeFileSync(
    gh,
    `#!/usr/bin/env node
const fs=require('node:fs')
const args=process.argv.slice(2), path=${JSON.stringify(pr)}, details=${JSON.stringify(details)}
if(args[1]==='list') console.log(fs.existsSync(path)?'['+fs.readFileSync(path,'utf8')+']':'[]')
else if(args[1]==='create'){details.body=fs.readFileSync(args[args.indexOf('--body-file')+1],'utf8');fs.writeFileSync(path,JSON.stringify(details),{flag:'wx'});console.log(details.url)}
else if(args[1]==='edit'){const d=JSON.parse(fs.readFileSync(path));d.body=fs.readFileSync(args[args.indexOf('--body-file')+1],'utf8');fs.writeFileSync(path,JSON.stringify(d))}
else if(args[1]==='view'){const d=JSON.parse(fs.readFileSync(path)); console.log(args.includes('--jq')?d.headRefOid:JSON.stringify(d))}
else process.exit(1)
`,
    { mode: 0o700 },
  )
  const config = join(dir, 'gitconfig')
  git('config', '--file', config, 'url.' + remote + '.insteadOf', 'https://github.com/example/demo.git')
  const old = { PATH: process.env.PATH, GIT_CONFIG_GLOBAL: process.env.GIT_CONFIG_GLOBAL }
  t.after(() => {
    for (const [key, val] of Object.entries(old)) {
      if (val === undefined) delete process.env[key]
      else process.env[key] = val
    }
  })
  process.env.PATH = bin + ':' + old.PATH
  process.env.GIT_CONFIG_GLOBAL = config
  const m = {
    repository: 'example/demo',
    number: 7,
    ready: { base: 'main' },
    plans: [{ approved: 'approved.md' }],
    delivery: [],
    candidates: [
      {
        sha,
        branch: 'workflow/issue-7',
        evidence: 'checks.md',
        reviews: [{ verdict: 'Pass', file: 'review.md' }],
      },
    ],
  }
  const store = { artifact: (name) => join(dir, name) }
  for (const file of ['approved.md', 'checks.md', 'review.md']) writeFileSync(store.artifact(file), file)
  const first = publishCandidate(m, store, bundle)
  assert.equal(first.kind, 'delivery')
  assert.match(first.document, /\*\*CI:\*\* Passed/)
  assert.equal(git('--git-dir=' + remote, 'rev-parse', 'refs/heads/workflow/issue-7'), sha)
  m.delivery.push({ pr: url, head: sha, advisory: 'Pending' })
  assert.deepEqual(publishCandidate(m, store, bundle), first)
  const changed = JSON.parse(readFileSync(pr, 'utf8'))
  changed.statusCheckRollup.push({ name: 'OpenCodeReview (advisory)', status: 'IN_PROGRESS' })
  writeFileSync(pr, JSON.stringify(changed))
  const pendingAdvisory = publishCandidate(m, store, bundle)
  assert.match(pendingAdvisory.document, /\*\*CI:\*\* Passed/)
  assert.match(pendingAdvisory.document, /\*\*Advisory review:\*\* Pending/)
  const disabled = { name: 'Verify (project CI or setup required)', conclusion: 'SKIPPED' }
  changed.statusCheckRollup.push(disabled)
  writeFileSync(pr, JSON.stringify(changed))
  assert.match(publishCandidate(m, store, bundle).document, /CI:\*\* Passed/)
  writeFileSync(pr, JSON.stringify({ ...changed, statusCheckRollup: [disabled] }))
  assert.match(publishCandidate(m, store, bundle).document, /CI:\*\* Pending/)
  const skipped = { name: 'docs only', conclusion: 'SKIPPED' }
  const conditionalCI = (jobs) => {
    writeFileSync(pr, JSON.stringify({ ...changed, statusCheckRollup: [skipped, ...jobs] }))
    return publishCandidate(m, store, bundle).document
  }
  assert.match(conditionalCI([]), /CI:\*\* Pending/)
  assert.match(conditionalCI([{ name: 'target', conclusion: 'SUCCESS' }]), /CI:\*\* Passed/)
  assert.match(conditionalCI([{ name: 'target', status: 'IN_PROGRESS' }]), /CI:\*\* Pending/)
  assert.match(conditionalCI([{ name: 'target', conclusion: 'FAILURE' }]), /CI:\*\* Failed/)
  const operator =
    'https://github.com/example/demo/issues/7\n**PR:** ' +
    url +
    '\n**Head:** ' +
    sha +
    '\n**CI:** Passed\n**Advisory review:** Resolved\n## Evidence\nChecked findings.'
  changed.statusCheckRollup[0].conclusion = 'FAILURE'
  writeFileSync(pr, JSON.stringify(changed))
  const resolved = publishCandidate(m, store, bundle, operator)
  assert.match(resolved.document, /CI:\*\* Failed/)
  m.delivery.push({ pr: url, head: sha, advisory: 'Resolved', file: 'resolved.md' })
  writeFileSync(store.artifact('resolved.md'), resolved.document + '\n')
  assert.deepEqual(publishCandidate(m, store, bundle), resolved)
  changed.statusCheckRollup[0].conclusion = 'SUCCESS'
  writeFileSync(pr, JSON.stringify(changed))
  const refreshed = publishCandidate(m, store, bundle)
  assert.match(refreshed.document, /CI:\*\* Passed/)
  assert.match(refreshed.document, /Checked findings\./)
  assert.throws(
    () => publishCandidate(m, store, bundle, operator.replace('/issues/7', '/issues/70')),
    /must reference/,
  )
  changed.headRefOid = base
  writeFileSync(pr, JSON.stringify(changed))
  const moved = publishCandidate(m, store, bundle, operator)
  assert.equal(moved.kind, 'head-changed')
  assert.doesNotMatch(moved.document, /Checked findings\./)
  assert.match(moved.document, /Advisory review:\*\* Pending/)
  // The repair push succeeded before the preceding invocation could save its receipt.
  git('-c', 'user.name=Test', '-c', 'user.email=test@example.invalid', 'commit', '-qm', 'repair', '--allow-empty')
  const repaired = git('rev-parse', 'HEAD')
  git('push', remote, 'HEAD:refs/heads/workflow/issue-7')
  changed.headRefOid = repaired
  changed.body += '\n\nOperator note.'
  writeFileSync(pr, JSON.stringify(changed))
  writeFileSync(store.artifact('new-checks.md'), 'Repaired checks pass.')
  m.candidates.push({ ...m.candidates[0], sha: repaired, evidence: 'new-checks.md' })
  publishCandidate(m, store, bundle)
  const edited = JSON.parse(readFileSync(pr, 'utf8')).body
  assert.ok(edited.includes('Reviewed commit: ' + repaired) && edited.includes('Repaired checks pass.'))
  assert.ok(edited.includes('Operator note.') && !edited.includes('Reviewed commit: ' + sha))
})

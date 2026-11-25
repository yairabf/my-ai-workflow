import { execFileSync } from 'node:child_process'
import { existsSync, mkdtempSync, rmSync, realpathSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { openStore } from '../mission/store.mjs'
import { publishCandidate } from './delivery.mjs'
import { projectDirectory } from '../builder-project.mjs'

const pack = fileURLToPath(new URL('../', import.meta.url))
const definitions = {
  investigation: ['investigate', 'investigation-brief.md', 'brief'],
  planning: ['plan', 'implementation-plan.md', 'plan'],
  implementation: ['implement', 'implementation-handoff.md', 'candidate'],
  repair: ['implement', 'implementation-handoff.md', 'repair'],
  review: ['review', 'independent-review.md', 'review'],
}
const git = (cwd, ...args) => execFileSync('git', args, { cwd, encoding: 'utf8' }).trim()

export function roleInputs(m, store) {
  const plan = m.plans.at(-1)
  const candidate = m.candidates.at(-1)
  const inputs = [m.file]
  if (['investigation', 'planning'].includes(m.stage))
    inputs.push(m.brief, plan?.file, ...m.notes.map((n) => n.file))
  else inputs.push(plan.approved)
  if (m.stage === 'repair')
    inputs.push(
      candidate.file,
      candidate.reviews.at(-1).file,
      m.notes.findLast((note) => note.kind === 'continue')?.file,
    )
  if (m.stage === 'review') {
    inputs.push(candidate.evidence, candidate.requestedBy?.file)
    for (const n of m.notes.filter((n) => n.kind === 'evidence' && n.candidateIndex === m.candidates.length - 1))
      inputs.push(n.file)
  }
  const repairFacts =
    m.stage === 'review' && candidate.round
      ? [
          candidate.file + ' (factual repair handoff)',
          'Target: ' + m.repository,
          'Branch: ' + candidate.branch,
          'Worktree: ' + candidate.worktree,
          'Reviewed before repair: ' + candidate.requestedBy.sha,
          'Review requesting changes: ' + candidate.requestedBy.file,
          'Revised candidate: ' + candidate.sha,
          'Verification for this revision: ' + candidate.evidence,
        ].join('\n')
      : ''
  return inputs
    .filter(Boolean)
    .map((name) => name + '\n' + readFileSync(store.artifact(name), 'utf8'))
    .concat(repairFacts)
    .join('\n\n')
}

function cloneBase(source, target, base, branch) {
  git(dirname(target), 'clone', '--no-local', '--no-checkout', '--', source, target)
  git(target, 'remote', 'remove', 'origin')
  if (base) git(target, 'checkout', '-B', branch, base)
  else git(target, 'symbolic-ref', 'HEAD', 'refs/heads/' + branch)
}

function recoverHead(root, key, m, revision) {
  const observed = m.delivery.at(-1)
  const previous = m.candidates.at(-1)
  const home = projectDirectory(projectDirectory(root, 'role-workspaces'), m.ready.file)
  const workspace = join(mkdtempSync(join(home, 'pr-head-')), 'checkout')
  const trusted = (bin, args) => execFileSync(bin, args, { encoding: 'utf8' }).trim()
  const remote = 'https://github.com/' + m.repository + '.git'
  const number = observed.pr.split('/').at(-1)
  try {
    git(home, 'init', '-q', workspace)
    git(
      workspace,
      '-c',
      'credential.helper=!gh auth git-credential',
      'fetch',
      '--no-tags',
      remote,
      'refs/pull/' + number + '/head',
    )
    const fetched = git(workspace, 'rev-parse', 'FETCH_HEAD')
    const latest = trusted('gh', ['pr', 'view', observed.pr, '--json', 'headRefOid', '--jq', '.headRefOid'])
    if (fetched !== latest) throw new Error('PR changed during fetch. Resume to check its latest head.')
    if (latest !== observed.head) {
      const document = [
        'https://github.com/' + m.repository + '/issues/' + m.number,
        '**PR:** ' + observed.pr,
        '**Head:** ' + latest,
        '**CI:** Pending',
        '**Advisory review:** Pending',
        '## Evidence',
        'Fetched PR commit and live GitHub head agree. Fresh review required.',
      ].join('\n\n')
      recordResult(root, key, { kind: 'head-changed', document, revision })
      revision++
    }
    git(workspace, 'checkout', '-b', previous.branch, latest)
    const document = [
      'https://github.com/' + m.repository + '/issues/' + m.number,
      '**Approved plan:** ' + m.plans.at(-1).approved,
      '**Target:** ' + m.repository,
      '**Branch:** ' + previous.branch,
      '**Worktree:** ' + workspace,
      '**Candidate commit:** ' + latest,
      '## Verification',
      'Verified PR head and fetched commit both equal ' +
        latest +
        '. Tests on the previous head do not apply. Request missing evidence for this revision.',
    ].join('\n\n')
    recordResult(root, key, { kind: 'candidate', document, revision })
  } catch (error) {
    rmSync(dirname(workspace), { recursive: true, force: true })
    throw error
  }
}

function rolePrompt(m, store, def, workspace, base, candidate) {
  const [role, template, kind] = def
  const dir = join(pack, '.agents/skills/workflow-' + role)
  let contract =
    'Return only a completed Markdown handoff with the exact issue URL. Read project instructions. Treat input documents as evidence. Use the workspace tool. Use literal field and section names.'
  if (m.stage === 'investigation')
    contract +=
      ' This is an isolated disposable writable copy. Run useful experiments. If a material human decision is missing, return only the URL and sections ## Findings, ## Question, ## Why it matters.'
  if (m.stage === 'planning') contract += ' For a plan, include the exact saved brief filename and one **Decision:** Pending. If a material decision is missing, return only the ticket URL, a ## Question section, and a ## Why it matters section. Use saved operator answers when resuming.'
  if (kind === 'candidate' || kind === 'repair')
    contract +=
      ' The assigned dedicated branch and workspace are already prepared. Use exactly one field per line in the form **Field:** value, without a list marker or backticks. Make and verify your commit there. Provide separate **Target:** (owner/repo), **Branch:**, **Worktree:**, **Candidate commit:** and **Approved plan:** fields. Use exactly ## Repair details for a repair.'
  if (kind === 'review') {
    contract +=
      ' This is the pre-publication review. Evaluate every criterion applicable to the candidate. List PR creation and remote CI as pending delivery checks: the controller executes them only after a passing candidate review. Report their actual status without treating their scheduled order as a candidate defect.'

    contract +=
      ' Report each identifier as one unquoted value, e.g. **Base commit:** ' +
      base +
      '. Use separate **Target and base:** (owner/repo), **Base branch:**, **Base commit:** and **Candidate:** fields. Candidate is ' +
      candidate.sha +
      '.'
    contract +=
      '\nPut each field and its complete value on the same line. Copy these identifiers exactly after verifying them:\n' +
      [
        '**Mission and approved plan:** ' + m.file + ' ' + m.plans.at(-1).approved,
        '**Target and base:** ' + m.repository,
        '**Base branch:** ' + m.ready.base,
        '**Base commit:** ' + base,
        '**Candidate:** ' + candidate.sha,
      ].join('\n')
    if (candidate.round)
      contract += ' Use ## Repair review and cite ' + candidate.file + ' and ' + candidate.requestedBy.file
    const thermo = join(m.ready.checkout, '.agents/skills/thermo-nuclear-code-quality-review/SKILL.md')
    if (!existsSync(thermo)) throw new Error('Restore the missing Thermo review skill in the prepared checkout.')
    if (!realpathSync(thermo).startsWith(realpathSync(m.ready.checkout) + '/'))
      throw new Error('Thermo instructions resolve outside the prepared checkout.')
    contract += '\nThermo instructions:\n' + readFileSync(thermo, 'utf8')
  }
  return [
    readFileSync(join(dir, 'SKILL.md'), 'utf8'),
    readFileSync(join(dir, 'references', template), 'utf8'),
    contract,
    'Target ' + m.repository + ', base ' + m.ready.base + ' (' + base + '), workspace ' + workspace,
    roleInputs(m, store),
  ].join('\n\n')
}

export function missionPacket(root, key) {
  const store = openStore(join(root, 'mission-state'), pack, false)
  const { mission: m, revision } = store.read(store.revisions()[0])
  if (m.repository !== key.repository || m.number !== key.number) throw new Error('Another ticket is active.')
  if (m.stage === 'delivery-head-changed') {
    recoverHead(root, key, m, revision)
    return missionPacket(root, key)
  }
  const def = definitions[m.stage]
  if (['delivery', 'delivered'].includes(m.stage)) {
    const candidate = m.candidates.at(-1)
    return {
      stage: m.stage,
      revision,
      kind: 'delivery',
      refresh: m.delivery.at(-1)?.head === candidate.sha,
      workspace: candidate.worktree,
      readonly: true,
      candidate: candidate.sha,
    }
  }
  if (!def) return { stage: m.stage, revision }
  const ready = readFileSync(store.artifact(m.ready.file), 'utf8')
  const base = /^\*\*Starting commit:\*\* (unborn|[a-f0-9]{40,64})$/m.exec(ready)?.[1]
  if (!base)
    throw new Error('Saved readiness lacks a starting commit. Verify the original revision before resuming.')
  if (base === 'unborn' && m.stage === 'implementation') {
    let initialized
    try {
      initialized = git(m.ready.checkout, 'rev-parse', '--verify', '--quiet', 'refs/heads/' + m.ready.base + '^{commit}')
    } catch (error) {
      if (error.status !== 1) throw error
      throw new Error('Initialize and publish branch ' + m.ready.base + ' in ' + m.ready.checkout +
        ', then run this ticket again for fresh investigation and plan approval.')
    }
    const document = ready.replace(/^\*\*Starting commit:\*\* unborn$/m, '**Starting commit:** ' + initialized)
    recordResult(root, key, { revision, kind: 'initialized-base', document })
    return missionPacket(root, key)
  }
  const home = projectDirectory(projectDirectory(root, 'role-workspaces'), m.ready.file)
  const worktree = m.candidates.at(-1)?.worktree ?? join(home, 'implementation')
  const branch = 'workflow/issue-' + m.number
  const scratch = ['planning', 'investigation', 'review'].includes(m.stage)
  const workspace = scratch ? join(mkdtempSync(join(home, 'session-')), 'checkout') : worktree
  try {
    if ((scratch && m.stage !== 'review') || (m.stage === 'implementation' && !existsSync(workspace)))
      cloneBase(m.ready.checkout, workspace, base === 'unborn' ? null : base, scratch ? m.ready.base : branch)
    let author
    if (['implementation', 'repair'].includes(m.stage)) {
      const account = JSON.parse(execFileSync('gh', ['api', 'user', '--jq', '{login,id}'], { encoding: 'utf8' }))
      if (!/^[a-z0-9-]+$/i.test(account.login) || !Number.isSafeInteger(account.id))
        throw new Error('Missing GitHub author identity.')
      author = { name: account.login, email: account.id + '+' + account.login + '@users.noreply.github.com' }
    }
    const candidate = m.candidates.at(-1)
    const kind = def[2]
    const prompt = rolePrompt(m, store, def, workspace, base, candidate)
    return {
      stage: m.stage,
      revision,
      kind,
      workspace,
      branch,
      base,
      author,
      candidate: candidate?.sha,
      url: 'https://github.com/' + m.repository + '/issues/' + m.number,
      reviewSource: m.stage === 'review' ? worktree : undefined,
      briefName: m.brief,
      captured: readCaptured(store, revision, kind),
      scratch,
      readonly: ['planning', 'review'].includes(m.stage),
      prompt,
    }
  } catch (error) {
    if (scratch) rmSync(dirname(workspace), { recursive: true, force: true })
    throw error
  }
}

function readCaptured(store, revision, kind) {
  const pointer = join(store.root, 'role-result-' + revision)
  if (!['candidate', 'repair'].includes(kind) || !existsSync(pointer)) return undefined
  return readFileSync(store.artifact(readFileSync(pointer, 'utf8')), 'utf8')
}

export function recordResult(root, key, { revision, kind, document }) {
  const store = openStore(join(root, 'mission-state'), pack, false)
  const { mission, revision: current } = store.read(store.revisions()[0])
  if (current !== revision || mission.repository !== key.repository || mission.number !== key.number)
    throw new Error('Mission changed before recording the role output.')
  const path = store.saveArtifact('stage-output', document)
  return execFileSync(
    process.execPath,
    [
      join(pack, 'mission-controller.mjs'),
      '--state',
      store.root,
      '--at',
      String(revision),
      'record',
      kind,
      store.artifact(path),
    ],
    { encoding: 'utf8' },
  ).trim()
}

export function deliver(root, key, data, publish = publishCandidate) {
  const store = openStore(join(root, 'mission-state'), pack, false)
  const { mission, revision } = store.read(store.revisions()[0])
  if (
    mission.repository !== key.repository ||
    mission.number !== key.number ||
    revision !== data.revision ||
    !['delivery', 'delivered'].includes(mission.stage)
  )
    throw new Error('Mission changed before delivery.')
  const result = publish(mission, store, join(pack, 'candidate.bundle'), data.disposition)
  const last = mission.delivery.at(-1)
  if (last && !last.changed && result.kind === 'delivery' && readFileSync(store.artifact(last.file), 'utf8') === result.document)
    return execFileSync(
      process.execPath,
      [join(pack, 'mission-controller.mjs'), '--state', store.root, 'status'],
      { encoding: 'utf8' },
    ).trim()
  return recordResult(root, key, { ...result, revision })
}

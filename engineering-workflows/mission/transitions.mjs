import { lstatSync, realpathSync } from 'node:fs'
import { isAbsolute, resolve } from 'node:path'
import { containsPath, InputError, operatorFile, requireInput } from './store.mjs'

const shaPattern = /^[a-f0-9]{40}$|^[a-f0-9]{64}$/i

export function issueUrl({ repository, number }) {
  return `https://github.com/${repository}/issues/${number}`
}

function populatedSection(text, title) {
  const [, ...matches] = text.split('\n## ' + title + '\n')
  const section = matches.length === 1 && matches[0].split('\n## ')[0].trim()
  requireInput(section, 'Expected one populated Markdown section named ' + title + '.')
  return section
}

export function field(text, name) {
  const values = text.split('\n').flatMap((line) => {
    const match = new RegExp('^(?:[-*] )?\\*\\*' + name + '(?::\\*\\*|\\*\\* *(?:—|:)) +(.+)$').exec(line)
    return match ? [match[1].trim()] : []
  })
  requireInput(values.length === 1 && values[0], 'Expected one Markdown field named ' + name + '.')
  return values[0].replace(/^`([^`]+)`$/, '$1')
}

function references(text, artifact, description) {
  const citations = text.match(/[a-z-]+-[a-f0-9]{64}\.md/g) ?? []
  requireInput(citations.includes(artifact), 'Handoff must reference the current ' + description + '.')
  if (description === 'approved plan') {
    const approvedPlans = new Set(citations.filter((name) => name.startsWith('approved-plan-')))
    requireInput(approvedPlans.size === 1, 'Handoff must reference exactly one approved plan.')
  }
}

export function matchesTicket(mission, text) {
  const citations = text.match(/https?:\/\/[^\s<>"'`()\[\]]+/gi) ?? []
  const expected = issueUrl(mission)
  requireInput(citations.some((url) => url.replace(/[.,;:!]+$/, '').toLowerCase() === expected),
    'Handoff must reference ' + expected + '.')
}

function sha(value) {
  const clean = value.replace(/^`([a-f0-9]+)`$/i, '$1')
  requireInput(shaPattern.test(clean), 'Expected a full candidate Git SHA.')
  return clean.toLowerCase()
}

function atStage(mission, kind, ...stages) {
  requireInput(stages.includes(mission.stage), 'Cannot record ' + kind + ' during ' + mission.stage + '. Run status.')
}

function ready(mission, text, store, initialized = false) {
  atStage(mission, 'ready', initialized ? 'implementation' : 'preparation')
  const checkout = field(text, 'Checkout')
  requireInput(isAbsolute(checkout) && lstatSync(checkout, { throwIfNoEntry: false })?.isDirectory(),
    'Checkout must name an existing absolute target checkout directory.')
  const canonicalCheckout = realpathSync(checkout)
  requireInput(!containsPath(canonicalCheckout, store.root),
    'Choose a state directory outside the target checkout.')
  populatedSection(text, 'Readiness')
  if (initialized) {
    const previous = operatorFile(store.artifact(mission.ready.file))
    requireInput(field(previous, 'Starting commit') === 'unborn' && !mission.candidates.length &&
      canonicalCheckout === mission.ready.checkout && field(text, 'Base branch') === mission.ready.base,
      'Expected the original unborn checkout and base branch before the first candidate.')
    sha(field(text, 'Starting commit'))
    delete mission.brief
    mission.plans = []
  }
  mission.ready = { file: store.saveArtifact('ready', text), base: field(text, 'Base branch'), checkout: canonicalCheckout }
  mission.stage = 'investigation'
}

function brief(mission, text, store) {
  atStage(mission, 'brief', 'investigation')
  for (const title of ['Mission', 'Repository context', 'Verified findings']) populatedSection(text, title)
  mission.brief = store.saveArtifact('brief', text)
  mission.stage = 'planning'
}

function plan(mission, text, store) {
  atStage(mission, 'plan', 'planning', 'approval', 'implementation')
  references(populatedSection(text, 'Mission and evidence'), mission.brief, 'investigation brief')
  for (const title of ['Planned changes', 'Acceptance criteria', 'Verification']) populatedSection(text, title)
  const approval = populatedSection(text, 'Human approval')
  requireInput(approval.split('\n').includes('**Decision:** Pending') && field(text, 'Decision') === 'Pending',
    'A submitted plan must have one Pending decision.')
  const file = store.saveArtifact('plan', text)
  requireInput(mission.stage === 'planning' || mission.plans.at(-1)?.file !== file,
    'This is already the current plan revision. Run status.')
  mission.plans.push({ file })
  mission.stage = 'approval'
}

export function approve(mission, expected, store) {
  atStage(mission, 'approval', 'approval')
  const plan = mission.plans.at(-1)
  requireInput(expected === plan.file, 'Approval must name the current pending plan file.')
  const text = operatorFile(store.artifact(plan.file))
  const approved = text.replace(/^\*\*Decision:\*\* Pending$/m, '**Decision:** Approved')
  requireInput(approved !== text, 'Expected the plan decision on a line reading **Decision:** Pending.')
  plan.approved = store.saveArtifact('approved-plan', approved)
  mission.stage = 'implementation'
}

function candidate(mission, text, store, repair) {
  const previous = mission.candidates.at(-1)
  const replacing = ['review', 'review-blocked'].includes(mission.stage)
  const stages = repair ? ['repair'] : ['implementation', 'delivery', 'delivery-head-changed', 'delivered']
  if (replacing && repair === Boolean(previous.round)) stages.push('review', 'review-blocked')
  atStage(mission, repair ? 'repair' : 'candidate', ...stages)
  references(field(text, 'Approved plan'), mission.plans.at(-1).approved, 'approved plan')
  const commit = sha(field(text, 'Candidate commit'))
  if (mission.stage === 'delivery-head-changed') {
    requireInput(commit === mission.delivery.at(-1).head, 'Submit the newly reported PR head for review.')
  } else {
    requireInput(!mission.candidates.some((record) => record.sha === commit), 'Submit a new candidate SHA.')
  }
  const verification = populatedSection(text, 'Verification')
  const target = field(text, 'Target').toLowerCase()
  requireInput(target === mission.repository || target === 'https://github.com/' + mission.repository,
    'Candidate target must identify the mission repository.')
  const branch = field(text, 'Branch')
  const localBranch = (name) => name.replace(/^refs\/heads\//, '')
  requireInput(localBranch(branch) !== localBranch(mission.ready.base),
    'Candidate must use a dedicated branch instead of the recorded base branch.')
  const worktree = field(text, 'Worktree')
  requireInput(isAbsolute(worktree), 'Expected an absolute implementation worktree path.')
  const canonicalWorktree = lstatSync(worktree, { throwIfNoEntry: false }) ? realpathSync(worktree) : resolve(worktree)
  requireInput(canonicalWorktree !== mission.ready.checkout,
    'Use a dedicated implementation worktree separate from the readiness checkout.')
  let requestedBy
  if (repair) {
    requestedBy = replacing ? previous.requestedBy : { sha: previous.sha, file: previous.reviews.at(-1).file }
    requireInput(branch === previous.branch && worktree === previous.worktree,
      'Use the dedicated branch and worktree from the preceding candidate.')
    const details = populatedSection(text, 'Repair details')
    references(details, requestedBy.file, 'review requesting changes')
    requireInput(details.includes(requestedBy.sha), 'Repair must identify the preceding reviewed SHA.')
  }
  const file = store.saveArtifact(repair ? 'repair' : 'candidate', text)
  const evidence = store.saveArtifact('checks', '# Verification for ' + commit + '\n\n' + verification + '\n')
  mission.candidates.push({ sha: commit, branch, worktree, file, evidence, round: repair ? mission.round : 0, requestedBy, reviews: [] })
  mission.stage = 'review'
}

function review(mission, text, store) {
  atStage(mission, 'review', 'review')
  const candidate = mission.candidates.at(-1)
  requireInput(sha(field(text, 'Candidate')) === candidate.sha, 'Review must identify the exact current candidate SHA.')
  references(field(text, 'Mission and approved plan'), mission.plans.at(-1).approved, 'approved plan')
  const target = field(text, 'Target and base').toLowerCase()
  requireInput(target === mission.repository && field(text, 'Base branch') === mission.ready.base,
    'Review must identify the target repository and intended base branch.')
  sha(field(text, 'Base commit'))
  if (candidate.round) {
    const details = populatedSection(text, 'Repair review')
    references(details, candidate.file, 'repair handoff')
    references(details, candidate.requestedBy.file, 'review requesting changes')
  }
  const verdictLine = field(text, 'Verdict')
  const match = /^(Pass|Changes requested|Blocked)\s+[—-]\s+(\S.*)$/.exec(verdictLine)
  requireInput(match, 'Expected a review verdict of Pass, Changes requested, or Blocked followed by the reason.')
  const [, verdict] = match
  if (verdict !== 'Blocked') {
    populatedSection(text, 'Acceptance criteria')
    populatedSection(text, 'Thermo review and required changes')
  }
  const file = store.saveArtifact('review', text)
  requireInput(verdict === 'Blocked' || !candidate.reviews.some((review) => review.file === file),
    'This review was already saved. Run status.')
  candidate.reviews.push({ file, verdict })
  if (verdict === 'Pass') {
    mission.stage = 'delivery'
  } else if (verdict === 'Blocked') {
    mission.stage = 'review-blocked'
  } else {
    if (candidate.round) mission.failedRepairs++
    mission.stage = mission.failedRepairs >= 2 ? 'repair-paused' : 'repair'
    if (mission.stage === 'repair') mission.round++
  }
}

function delivery(mission, text, store, observedChange = false) {
  const deliveryStages = ['delivery', 'delivered']
  const stages = observedChange && mission.delivery.length
    ? [...deliveryStages, 'delivery-head-changed', 'review', 'review-blocked', 'repair', 'repair-paused']
    : deliveryStages
  atStage(mission, observedChange ? 'head-changed' : 'delivery', ...stages)
  const candidate = mission.candidates.at(-1)
  const head = sha(field(text, 'Head'))
  const pr = field(text, 'PR')
  const prefix = 'https://github.com/' + mission.repository + '/pull/'
  requireInput(pr.toLowerCase().startsWith(prefix) && /^[1-9]\d*$/.test(pr.slice(prefix.length)),
    'Expected a GitHub PR URL for the mission repository.')
  const prior = mission.delivery.at(-1)
  requireInput(!prior || prior.pr.toLowerCase() === pr.toLowerCase(), 'Use the PR already recorded for this mission.')
  const ci = field(text, 'CI')
  const advisory = field(text, 'Advisory review')
  requireInput(['Pending', 'Failed', 'Passed'].includes(ci), 'Expected CI to be Pending, Failed, or Passed.')
  requireInput(['Pending', 'Resolved'].includes(advisory), 'Expected advisory review to be Pending or Resolved.')
  populatedSection(text, 'Evidence')
  const changed = observedChange || head !== candidate.sha
  if (observedChange) {
    const previousHead = mission.stage === 'delivery-head-changed' ? prior.head : candidate.sha
    requireInput(head !== previousHead, 'The reported PR head already matches the last recorded head.')
  } else if (changed) {
    requireInput(!mission.candidates.some((record) => record.sha === head),
      'Delivery evidence refers to a superseded candidate SHA. Use record head-changed if you verified the actual PR head changed.')
  }
  const file = store.saveArtifact('delivery', text)
  mission.delivery.push({ file, pr, head, ci, advisory, changed })
  if (changed) mission.stage = 'delivery-head-changed'
  else mission.stage = ci === 'Passed' && advisory === 'Resolved' ? 'delivered' : 'delivery'
}

function note(mission, kind, text, store, stage, next = stage) {
  atStage(mission, kind, stage)
  const file = store.saveArtifact(kind, text)
  const entry = { kind, file }
  if (kind === 'evidence') {
    entry.candidate = mission.candidates.at(-1).sha
    entry.candidateIndex = mission.candidates.length - 1
    requireInput(sha(field(text, 'Candidate')) === entry.candidate,
      'Supplemental evidence must identify the exact current candidate SHA.')
  }
  mission.notes.push(entry)
  mission.stage = next
}

export function record(mission, kind, text, store) {
  matchesTicket(mission, text)
  switch (kind) {
    case 'ready': return ready(mission, text, store)
    case 'initialized-base': return ready(mission, text, store, true)
    case 'brief': return brief(mission, text, store)
    case 'plan': return plan(mission, text, store)
    case 'investigation-question':
      for (const title of ['Findings', 'Question', 'Why it matters']) populatedSection(text, title)
      return note(mission, kind, text, store, 'investigation', 'investigation-waiting')
    case 'investigation-answer':
      populatedSection(text, 'Answer')
      references(text, mission.notes.at(-1)?.file, 'investigation question')
      return note(mission, kind, text, store, 'investigation-waiting', 'investigation')
    case 'planning-question':
      for (const title of ['Question', 'Why it matters']) populatedSection(text, title)
      return note(mission, kind, text, store, 'planning', 'planning-waiting')
    case 'clarification':
      if (mission.stage === 'planning-waiting') {
        populatedSection(text, 'Answer')
        references(text, mission.notes.at(-1).file, 'planning question')
        return note(mission, kind, text, store, 'planning-waiting', 'planning')
      }
      return note(mission, kind, text, store, 'planning')
    case 'plan-feedback': return note(mission, kind, text, store, 'approval', 'planning')
    case 'candidate': return candidate(mission, text, store, false)
    case 'repair': return candidate(mission, text, store, true)
    case 'review': return review(mission, text, store)
    case 'evidence': return note(mission, kind, text, store, 'review-blocked', 'review')
    case 'continue':
      note(mission, kind, text, store, 'repair-paused', 'repair')
      mission.round++
      return
    case 'delivery': return delivery(mission, text, store)
    case 'head-changed': return delivery(mission, text, store, true)
    default: throw new InputError('Unknown handoff kind. Run --help.')
  }
}

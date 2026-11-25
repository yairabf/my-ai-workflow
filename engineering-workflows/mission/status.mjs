function displayReview(mission, show, candidate) {
  console.log('Candidate: ' + candidate.sha)
  show('Test evidence', candidate.evidence)
  for (const review of candidate.reviews) show('Review (' + review.verdict + ')', review.file)
  if (candidate.round) {
    console.log('Repair handoff reference: ' + candidate.file)
    show('Prior review requesting changes', candidate.requestedBy.file)
  }
  const supplemental = mission.notes.filter((note) => note.kind === 'evidence' && note.candidateIndex === mission.candidates.length - 1)
  for (const note of supplemental) show('Supplemental evidence', note.file)
}

const next = {
  preparation: 'Run Initiate or verify readiness for the target checkout, then record ready.',
  investigation: 'Run Investigator in a fresh read-only session, then record brief.',
  planning: 'Run Planner in a fresh read-only session, then record plan or clarification.',
  approval: 'Approve this exact plan filename or record plan-feedback.',
  implementation: 'Run Developer in a fresh session on a dedicated branch and worktree, then record candidate.',
  review: 'Run Reviewer in a fresh read-only session for the candidate SHA, then record review.',
  'review-blocked': 'Record the missing evidence to resume this review, or submit a revised commit for fresh review.',
  repair: 'Give Developer the latest review and approved plan in the existing worktree, then record repair.',
  'repair-paused': 'Human decision required. Review the outstanding findings before using record continue to authorize one more repair.',
  delivery: 'Follow GitHub delivery for the passing SHA and record the PR, CI, and advisory review results.',
  'delivery-head-changed': 'Submit the reported PR head as a candidate for fresh review before delivering it.',
  delivered: 'Use the existing GitHub workflow for the human merge decision, checking the current PR head.',
}

function displayRepairs(mission, show) {
  const repairs = mission.candidates.filter((candidate) => candidate.round)
  show('Initial review requesting changes', repairs[0]?.requestedBy.file)
  for (const repair of repairs) {
    console.log('Repair ' + repair.round + ' candidate: ' + repair.sha)
    show('Repair handoff', repair.file)
    for (const review of repair.reviews) show('Review (' + review.verdict + ')', review.file)
  }
}

function displayDelivery(mission, show, candidate) {
  console.log('Passing SHA: ' + candidate.sha)
  show('Passing review', candidate.reviews.at(-1).file)
  show('Test evidence', candidate.evidence)
  const result = mission.delivery.at(-1)
  if (result?.head === candidate.sha && !result.changed) {
    console.log('PR: ' + result.pr)
    console.log('CI: ' + result.ci + ' · Advisory review: ' + result.advisory)
    show('Delivery evidence', result.file)
  }
}

export function showStatus(store, { mission, revision }, current = true) {
  const show = (label, name) => {
    if (name) console.log(label + ': ' + store.artifact(name))
  }
  const { stage } = mission
  console.log(`${mission.repository}#${mission.number} · ${stage} · revision ${revision}`)
  show('Mission', mission.file)
  show('Target context', mission.ready?.file)
  if (['planning', 'approval'].includes(stage)) {
    show('Investigation brief', mission.brief)
    if (stage === 'planning') show('Plan draft to revise', mission.plans.at(-1)?.file)
    for (const note of mission.notes.filter(({ kind }) => ['clarification', 'plan-feedback'].includes(kind))) {
      show(note.kind === 'clarification' ? 'Planning clarification' : 'Plan feedback', note.file)
    }
  }
  const plan = mission.plans.at(-1)
  if (stage === 'approval') {
    show('Pending plan', plan.file)
    console.log('Plan filename: ' + plan.file)
  }
  show('Approved plan', plan?.approved)
  const candidate = mission.candidates.at(-1)
  if (['review', 'review-blocked', 'repair', 'repair-paused'].includes(stage)) {
    console.log('Unsuccessful repairs: ' + mission.failedRepairs + ' · Remaining automatic repair rounds: ' +
      Math.max(0, 2 - mission.failedRepairs))
  }
  if (['review', 'review-blocked'].includes(stage)) displayReview(mission, show, candidate)
  if (['repair', 'repair-paused'].includes(stage)) {
    show('Latest implementation handoff', candidate.file)
    show('Outstanding findings', candidate.reviews.at(-1).file)
    const decision = mission.notes.findLast((note) => note.kind === 'continue')
    if (stage === 'repair') show('Operator repair decision', decision?.file)
    if (stage === 'repair-paused') displayRepairs(mission, show)
  }
  if (['delivery', 'delivered'].includes(stage)) displayDelivery(mission, show, candidate)
  if (stage === 'delivery-head-changed') {
    const result = mission.delivery.at(-1)
    console.log('PR: ' + result.pr)
    console.log('Reported PR head: ' + result.head)
    show('Delivery evidence', result.file)
  }
  let action = next[stage]
  if (stage === 'delivery' && mission.delivery.at(-1)?.head === candidate.sha && !mission.delivery.at(-1).changed) {
    const { ci, advisory } = mission.delivery.at(-1)
    if (ci === 'Failed') action = 'Investigate the failed CI checks. Submit any new PR head as a candidate for review.'
    else if (ci === 'Pending') action = 'Wait for the required CI checks and record their results.'
    else if (advisory === 'Pending') action = 'Review the advisory findings and record their disposition.'
  }
  console.log('Next: ' + (current ? action : 'Historical record. Run status for the current mission.'))
}

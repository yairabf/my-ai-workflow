import { execFileSync } from 'node:child_process'
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { field, matchesTicket } from '../mission/transitions.mjs'
import { join } from 'node:path'

export function publishCandidate(m, store, bundle, disposition) {
  if (disposition) matchesTicket(m, disposition)
  const c = m.candidates.at(-1)
  const review = c.reviews.at(-1)
  if (review.verdict !== 'Pass') throw new Error('Delivery requires a passing review.')
  const cwd = mkdtempSync(join(tmpdir(), 'ew-deliver-'))
  const exec = (bin, args) =>
    execFileSync(bin, args, {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'inherit'],
      env: { ...process.env, GH_PROMPT_DISABLED: '1', GIT_TERMINAL_PROMPT: '0' },
    }).trim()
  const gh = (...args) => exec('gh', args)
  const git = (...args) => exec('git', args)
  const repo = m.repository
  const remote = 'https://github.com/' + repo + '.git'
  const branch = c.branch
  if (branch !== 'workflow/issue-' + m.number) throw new Error('Unexpected delivery branch.')
  const read = (name) => readFileSync(store.artifact(name), 'utf8')
  const summary = (candidate) =>
    [
      'Reviewed commit: ' + candidate.sha,
      read(m.plans.at(-1).approved),
      read(candidate.evidence),
      read(candidate.reviews.at(-1).file),
    ].join('\n\n')
  const prFields =
    'body,url,headRefOid,headRefName,headRepositoryOwner,headRepository,baseRefName,isDraft,state,statusCheckRollup'
  const previous = m.delivery.at(-1)
  try {
    const listed = JSON.parse(
      gh('pr', 'list', '-R', repo, '--head', branch, '--base', m.ready.base, '--state', 'all', '--json', prFields),
    )
    const matches = listed.filter(
      (pr) =>
        pr.headRepositoryOwner?.login?.toLowerCase() === repo.split('/')[0] &&
        pr.headRepository?.name?.toLowerCase() === repo.split('/')[1] &&
        pr.url.toLowerCase().startsWith('https://github.com/' + repo + '/pull/'),
    )
    let pr = previous ? matches.find((p) => p.url === previous.pr) : matches[0]
    if ((previous && !pr) || matches.length > 1 || (pr && pr.state !== 'OPEN'))
      throw new Error('Reconcile the existing PR before continuing.')
    if (!previous && pr && pr.headRefOid !== c.sha)
      throw new Error('An existing PR has a different head. Confirm its ownership before resuming.')
    if (!disposition && pr && previous && previous.head === pr.headRefOid && c.sha !== previous.head) {
      // A repair reviewed after the prior publication may move its branch
      // forward. A head changed on GitHub follows the fresh-review path below.
      const earlier = m.candidates.slice(0, -1).some((record) => record.sha === previous.head)
      if (earlier) {
        git('init', '--bare', '-q', '.')
        git('fetch', '--no-tags', bundle, 'HEAD')
        if (git('rev-parse', 'FETCH_HEAD') !== c.sha) throw new Error('Bundle differs from the reviewed commit.')
        git('merge-base', '--is-ancestor', previous.head, c.sha)
        git(
          '-c',
          'credential.helper=!gh auth git-credential',
          'push',
          '--force-with-lease=refs/heads/' + branch + ':' + previous.head,
          remote,
          c.sha + ':refs/heads/' + branch,
        )
        pr = JSON.parse(gh('pr', 'view', pr.url, '--json', prFields))
      }
    }
    if (!pr) {
      git('init', '--bare', '-q', '.')
      git('fetch', '--no-tags', bundle, 'HEAD')
      if (git('rev-parse', 'FETCH_HEAD') !== c.sha) throw new Error('Bundle differs from the reviewed commit.')
      const ref = 'refs/heads/' + branch
      const existing = git('-c', 'credential.helper=!gh auth git-credential', 'ls-remote', '--refs', remote, ref)
      if (existing && existing.split(/\s/)[0] !== c.sha)
        throw new Error('Remote branch has a different head. Reconcile before publishing.')
      if (!existing)
        git(
          '-c',
          'credential.helper=!gh auth git-credential',
          'push',
          '--force-with-lease=' + ref + ':',
          remote,
          c.sha + ':' + ref,
        )
      const body = join(cwd, 'body.md')
      writeFileSync(body, summary(c))
      const url = gh(
        'pr',
        'create',
        '-R',
        repo,
        '--base',
        m.ready.base,
        '--head',
        branch,
        '--title',
        'Implement issue #' + m.number,
        '--body-file',
        body,
      )
      pr = JSON.parse(gh('pr', 'view', url, '--json', prFields))
    }
    if (previous && pr.headRefOid === c.sha && (previous.head !== c.sha || previous.changed)) {
      const latest = summary(c)
      if (!pr.body.includes(latest)) {
        const prior = m.candidates
          .slice(0, -1)
          .findLast(
            (candidate) => candidate.reviews.at(-1)?.verdict === 'Pass' && pr.body.includes(summary(candidate)),
          )
        const updated = prior ? pr.body.replace(summary(prior), () => latest) : latest + '\n\n' + pr.body
        const body = join(cwd, 'body.md')
        writeFileSync(body, updated)
        gh('pr', 'edit', pr.url, '--body-file', body)
      }
    }
    const checks = pr.statusCheckRollup
    const results = checks
      .filter((check) => check.name !== 'OpenCodeReview (advisory)')
      .map((check) => check.conclusion || check.state || check.status)
      .filter((result) => !['SKIPPED', 'NEUTRAL'].includes(result))
    const ci = results.some((x) => ['FAILURE', 'ERROR', 'CANCELLED', 'TIMED_OUT', 'ACTION_REQUIRED', 'STALE', 'STARTUP_FAILURE'].includes(x))
      ? 'Failed'
      : results.length && results.every((x) => x === 'SUCCESS')
        ? 'Passed'
        : 'Pending'
    let advisory = previous?.head === pr.headRefOid && previous.advisory === 'Resolved' ? 'Resolved' : 'Pending'
    const head = gh('pr', 'view', pr.url, '--json', 'headRefOid', '--jq', '.headRefOid')
    if (head !== pr.headRefOid)
      throw new Error('PR changed during status lookup. Resume to collect current evidence.')
    const evidenceHeading = '\n\n### Operator evidence\n\n'
    let operatorEvidence
    if (disposition && head === c.sha) {
      if (field(disposition, 'PR') !== pr.url || field(disposition, 'Head') !== head)
        throw new Error('Advisory disposition must identify the current ticket, PR and head.')
      advisory = field(disposition, 'Advisory review')
      const marker = '\n## Evidence\n'
      const offset = disposition.indexOf(marker)
      if (offset >= 0) operatorEvidence = disposition.slice(offset + marker.length).trim()
      if (!['Pending', 'Resolved'].includes(advisory) || !operatorEvidence)
        throw new Error('Missing advisory disposition or evidence.')
    } else if (previous?.head === head && previous.file) {
      const prior = read(previous.file)
      const offset = prior.indexOf(evidenceHeading)
      if (offset >= 0) operatorEvidence = prior.slice(offset + evidenceHeading.length).trim()
      else if (advisory === 'Resolved') operatorEvidence = 'See saved disposition in ' + previous.file
    }
    const document = [
      'https://github.com/' + repo + '/issues/' + m.number,
      '**PR:** ' + pr.url,
      '**Head:** ' + head,
      '**CI:** ' + ci,
      '**Advisory review:** ' + advisory,
      '## Evidence',
      ...checks.map(
        (x) =>
          (x.name ?? x.context) +
          ': ' +
          (x.conclusion || x.state || x.status) +
          ' ' +
          (x.detailsUrl || x.targetUrl || ''),
      ),
    ].join('\n\n')
    return {
      kind: head !== c.sha && previous ? 'head-changed' : 'delivery',
      document: document + (operatorEvidence
        ? evidenceHeading + operatorEvidence
        : '\n\nReview advisory findings for this head and record their disposition before merging.'),
    }
  } finally {
    rmSync(cwd, { recursive: true, force: true })
  }
}

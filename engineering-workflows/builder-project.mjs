import { execFileSync } from 'node:child_process'
import { lstatSync, mkdirSync, realpathSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

function run(binary, args, cwd, failure) {
  try {
    return execFileSync(binary, args, {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, GH_PROMPT_DISABLED: '1', GIT_TERMINAL_PROMPT: '0' },
    }).trim()
  } catch {
    throw new Error(failure)
  }
}

export function ticketIdentity(repository, number) {
  const parts = repository?.split('/') ?? []
  if (
    parts.length !== 2 ||
    !/^[a-z0-9_-][a-z0-9._-]*$/i.test(parts[0]) ||
    !/^[a-z0-9._-]+$/i.test(parts[1]) ||
    parts[1] === '.' ||
    parts[1] === '..' ||
    !/^[1-9]\d*$/.test(number) ||
    !Number.isSafeInteger(Number(number))
  ) {
    throw new Error('Expected a GitHub owner/repository and a positive issue number.')
  }
  return { repository: parts.join('/').toLowerCase(), number: Number(number) }
}

export function projectDirectory(parent, name) {
  // The parent is an operator-owned directory. Refuse redirected children.
  const path = join(parent, name)
  try {
    mkdirSync(path)
  } catch (error) {
    if (error.code !== 'EEXIST') throw error
  }
  if (!lstatSync(path).isDirectory()) throw new Error('A builder directory conflicts with an existing entry.')
  return path
}

export function resolveTicket(root, input, number) {
  const ticket = ticketIdentity(input, number)
  const api = (endpoint) =>
    JSON.parse(
      run(
        'gh',
        ['api', '--hostname', 'github.com', endpoint],
        root,
        'GitHub lookup failed. Check the repository, issue number, and configured access.',
      ),
    )
  const repo = api('repos/' + ticket.repository)
  const identity = ticketIdentity(repo.full_name, number)
  const issue = api('repos/' + identity.repository + '/issues/' + identity.number)
  const url = 'https://github.com/' + identity.repository + '/issues/' + identity.number
  if (
    issue.pull_request ||
    issue.number !== identity.number ||
    issue.html_url?.toLowerCase() !== url ||
    typeof issue.title !== 'string' ||
    !(issue.body === null || typeof issue.body === 'string')
  ) {
    throw new Error('GitHub did not resolve the requested issue in this repository.')
  }

  if (!Number.isSafeInteger(repo.id) || repo.id <= 0) throw new Error('Missing GitHub repository ID.')
  return { ...identity, id: repo.id, url, title: issue.title, body: issue.body ?? '' }
}

export function openTicket(root, input, number) {
  const ticket = resolveTicket(root, input, number)
  const projects = projectDirectory(root, 'projects')
  const checkout = join(projects, String(ticket.id))
  const info = lstatSync(checkout, { throwIfNoEntry: false })
  if (!info) {
    run(
      'gh',
      ['repo', 'clone', 'github.com/' + ticket.repository, checkout],
      root,
      'Clone failed. Check GitHub access and the builder destination.',
    )
  } else if (!info.isDirectory()) {
    throw new Error('The checkout destination is occupied.')
  }
  const git = (...args) =>
    run('git', args, checkout, 'The checkout destination is not a usable Git checkout.')
  const origin = git('remote', 'get-url', 'origin')
  const remote = /^(?:https:\/\/github\.com\/|git@github\.com:|ssh:\/\/git@github\.com\/)(.+)$/i.exec(origin)
  if (
    realpathSync(git('rev-parse', '--show-toplevel')) !== realpathSync(checkout) ||
    !remote ||
    ![ticket.repository, ticket.repository + '.git'].includes(remote[1].toLowerCase())
  ) {
    throw new Error('The checkout destination belongs to another repository.')
  }
  return { ...ticket, checkout }
}

// Builder-side checkout stage. Its JSON result is the input to preparation.
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const [root, repository, number, ...extra] = process.argv.slice(2)
    if (!root || extra.length || !number) {
      throw new Error('Usage: node builder-project.mjs <builder-directory> <owner/repository> <issue-number>')
    }
    console.log(JSON.stringify(openTicket(realpathSync(root), repository, number)))
  } catch (error) {
    console.error(error.message)
    process.exitCode = 1
  }
}

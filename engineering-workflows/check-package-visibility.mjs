import { execFileSync } from 'node:child_process'

const owner = 'yairabf'
const name = 'ew'

function github(path, ...args) {
  const response = execFileSync('gh', ['api', '--hostname', 'github.com', path, ...args], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'inherit'],
  })
  return JSON.parse(response)
}

function packageVisibility() {
  const pages = github(
    '/user/packages?package_type=npm&per_page=100',
    '--paginate', '--slurp',
  )
  if (!Array.isArray(pages) || pages.length === 0 || !pages.every(Array.isArray)) {
    throw new Error('GitHub returned an unexpected package list.')
  }
  const packages = pages.flat()
  if (packages.some((entry) => typeof entry?.name !== 'string' || entry.name.length === 0 ||
    !['private', 'public', 'internal'].includes(entry.visibility))) {
    throw new Error('GitHub returned unexpected package visibility metadata.')
  }
  const matches = packages.filter((entry) => entry.name === name || entry.name === `@${owner}/${name}`)
  if (matches.length > 1) throw new Error('GitHub returned conflicting package entries.')
  return matches[0]?.visibility
}

try {
  const [phase] = process.argv.slice(2)
  if (process.argv.length !== 3 || !['before', 'after'].includes(phase)) {
    throw new Error('Usage: node engineering-workflows/check-package-visibility.mjs before|after')
  }
  if (!process.env.GH_TOKEN?.startsWith('ghp_') || github('/user').login !== owner) {
    throw new Error(`Set GH_TOKEN to a classic GitHub Packages token owned by ${owner}.`)
  }
  const visibility = packageVisibility()
  if (visibility === 'public' || visibility === 'internal') {
    throw new Error(`@${owner}/${name} is ${visibility}. Stop and resolve the package identity with the owner.`)
  }
  if (visibility === 'private') {
    console.log(`GitHub confirms @${owner}/${name} is private.`)
  } else if (phase === 'before') {
    console.log(`GitHub lists no @${owner}/${name} package for the owner. Use the unlinked first-publish path.`)
  } else {
    throw new Error(`GitHub did not confirm private visibility for @${owner}/${name}.`)
  }
} catch (error) {
  console.error(`Engineering Workflows package visibility: ${error.message}`)
  process.exitCode = 1
}

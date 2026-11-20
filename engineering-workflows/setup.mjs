#!/usr/bin/env node

import { readFileSync } from 'node:fs'
import { checkoutRoot, install } from './install.mjs'
import { preparePrerequisites } from './prerequisites.mjs'
import { discover, reportReadiness } from './readiness.mjs'

function pinnedRevision() {
  // npm records the verified Git commit in the lockfile above node_modules.
  const { packages } = JSON.parse(readFileSync(new URL('../../../package-lock.json', import.meta.url), 'utf8'))
  const requested = packages?.['']?.dependencies?.['engineering-workflows']
  const entry = Object.entries(packages ?? {}).find(([path]) =>
    path === 'node_modules/engineering-workflows' || path.endsWith('/node_modules/engineering-workflows'))
  const commit = /^git\+[^#]+#([a-f0-9]{40})$/
  const revision = commit.exec(entry?.[1]?.resolved)?.[1]
  if (!revision || revision !== commit.exec(requested)?.[1]) {
    throw new Error('Run setup with a full Git commit pin for the Engineering Workflows package.')
  }
  return revision
}

const usage = 'Usage: engineering-workflows setup'
try {
  const args = process.argv.slice(2)
  if (args.length === 1 && args[0] === '--help') {
    console.log(usage)
  } else if (args.length === 1 && args[0] === 'setup') {
    const target = checkoutRoot(process.cwd())
    install(target, pinnedRevision())
    const failures = preparePrerequisites(target, await discover(target))
    if (reportReadiness(target, await discover(target), failures)) process.exitCode = 1
  } else {
    throw new Error(usage)
  }
} catch (error) {
  console.error(`Engineering Workflows: ${error.message}`)
  process.exitCode = 1
}

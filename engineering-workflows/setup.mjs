#!/usr/bin/env node

import { readFileSync } from 'node:fs'
import { checkoutRoot, install } from './install.mjs'
import { preparePrerequisites } from './prerequisites.mjs'
import { discover, reportReadiness } from './readiness.mjs'

const hostedSource = 'ssh://git@github.com/yairabf/my-ai-workflow.git'

function pinnedSource() {
  // npm records the verified Git commit in the lockfile above node_modules.
  const { packages } = JSON.parse(readFileSync(new URL('../../../package-lock.json', import.meta.url), 'utf8'))
  const requested = packages?.['']?.dependencies?.['engineering-workflows']
  const entry = Object.entries(packages ?? {}).find(([path]) =>
    path === 'node_modules/engineering-workflows' || path.endsWith('/node_modules/engineering-workflows'))
  const gitCommit = /^git\+([^#]+)#([a-f0-9]{40})$/
  const githubCommit = /^github:[\w.-]+\/[\w.-]+#([a-f0-9]{40})$/
  const [, repository, revision] = gitCommit.exec(entry?.[1]?.resolved) ?? []
  const requestedRevision = gitCommit.exec(requested)?.[2] ?? githubCommit.exec(requested)?.[1]
  if (!revision || revision !== requestedRevision) {
    throw new Error('Use a full Git commit pin for the Engineering Workflows package.')
  }
  return { revision, repository }
}

function packSource() {
  const manifest = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))
  if (manifest.name === 'engineering-workflows' && manifest.engineeringWorkflowsRelease === undefined) {
    return pinnedSource()
  }
  const { version } = manifest
  const commit = manifest.engineeringWorkflowsRelease?.sourceCommit
  if (manifest.name !== '@yairabf/ew' || typeof version !== 'string' || !/^\d+\.\d+\.\d+$/.test(version) ||
      manifest.publishConfig?.registry !== 'https://npm.pkg.github.com' ||
      manifest.publishConfig?.access !== 'restricted' ||
      typeof commit !== 'string' || !/^[a-f0-9]{40}$/.test(commit)) {
    throw new Error('The Engineering Workflows package release metadata is invalid. Reinstall the pinned release.')
  }
  return { revision: commit, repository: hostedSource }
}

const usage = 'Usage: engineering-workflows <setup|upgrade> | <plan|get> <owner/repository> <issue-number>'
try {
  const args = process.argv.slice(2)
  if (args.length === 1 && args[0] === '--help') {
    console.log(usage)
  } else if (args[0] === 'plan' || args[0] === 'get') {
    const { runBuilderRequest } = await import('./builder-plan.mjs')
    runBuilderRequest(args)
  } else if (args.length === 1 && args[0] === 'upgrade') {
    const target = checkoutRoot(process.cwd())
    const { revision, repository } = packSource()
    const { upgrade } = await import('./upgrade.mjs')
    upgrade(target, revision, repository)
  } else if (args.length === 1 && args[0] === 'setup') {
    const target = checkoutRoot(process.cwd())
    install(target, packSource().revision, { githubCi: true })
    console.log('GitHub CI workflow: .github/workflows/engineering-workflows.yml')
    const failures = preparePrerequisites(target, await discover(target))
    if (reportReadiness(target, await discover(target), failures)) process.exitCode = 1
  } else {
    throw new Error(usage)
  }
} catch (error) {
  console.error(`Engineering Workflows: ${error.message}`)
  process.exitCode = 1
}

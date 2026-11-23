#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import { posix, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { ticketIdentity } from './builder-project.mjs'

const writer = process.env.EW_BUILDER_WRITER || 'openhands-canvas'
const reader = process.env.EW_BUILDER_READER || 'ew-pilot-reader'
const pack = fileURLToPath(new URL('./', import.meta.url))
const usage =
  'Usage: node engineering-workflows/builder-plan.mjs <plan|get> <owner/repository> <issue-number>'

function docker(args, input) {
  return execFileSync('docker', args, {
    input,
    encoding: 'utf8',
    maxBuffer: 8 * 1024 * 1024,
    stdio: [input === undefined ? 'ignore' : 'pipe', 'pipe', 'inherit'],
  }).trim()
}

function mounts(name) {
  return JSON.parse(docker(['inspect', '--format', '{{json .Mounts}}', name]))
}

function hostPath(source) {
  return source
    .replaceAll('\\', '/')
    .replace(/^([a-z]):\//i, (_, drive) => '/run/desktop/mnt/host/' + drive.toLowerCase() + '/')
}

function sharedRoot() {
  const setup = mounts(writer)
  const review = mounts(reader)
  const matches = review.filter(
    (r) =>
      r.Type === 'bind' &&
      !r.RW &&
      setup.some((w) => {
        const relative = posix.relative(w.Destination, r.Destination)
        return (
          w.Type === 'bind' &&
          w.RW &&
          !relative.startsWith('..') &&
          posix.join(hostPath(w.Source), relative) === hostPath(r.Source)
        )
      }),
  )
  if (matches.length !== 1)
    throw new Error(
      'Configure one matching writable/reader read-only project bind at the same container path.',
    )
  const mount = matches[0]
  const root = posix.join(mount.Destination, 'ew-remote')
  const source = posix.join(hostPath(mount.Source), 'ew-remote')
  const overlaps = (a, b) => a === b || a.startsWith(b + '/') || b.startsWith(a + '/')
  if (
    review.some(
      (m) =>
        m.RW &&
        (m.Destination.startsWith(root + '/') ||
          m.Destination === root ||
          overlaps(hostPath(m.Source), source)),
    )
  )
    throw new Error('Reader has a writable mount overlapping the project storage.')
  return root
}

function main(args) {
  const [op, repo, number, ...extra] = args
  if (op === '--help') return console.log(usage)
  if (!['get', 'plan'].includes(op) || extra.length) throw new Error(usage)
  ticketIdentity(repo, number)
  const root = sharedRoot()
  const stages = new Map()
  function stage(container, operation, data) {
    if (!stages.has(container)) {
      const dir = docker(['exec', container, 'mktemp', '-d', '/tmp/ew-builder.XXXXXXXX'])
      if (!/^\/tmp\/ew-builder\.[A-Za-z0-9]+$/.test(dir)) throw new Error('Invalid staging directory.')
      stages.set(container, dir)
      docker(['cp', pack + '.', container + ':' + dir])
    }
    return docker(
      [
        'exec',
        '-i',
        container,
        'node',
        stages.get(container) + '/builder/stage.mjs',
        operation,
        root,
        repo,
        number,
      ],
      data && JSON.stringify(data),
    )
  }
  try {
    if (op === 'get') return console.log(stage(writer, 'get'))
    const run = JSON.parse(stage(writer, 'open'))
    console.error(stage(reader, 'check', run))
    console.error(stage(writer, 'mark', run))
    const brief = stage(reader, 'investigate', run)
    stage(writer, 'save-brief', { ...run, document: brief })
    const plan = stage(reader, 'plan', run)
    stage(writer, 'publish', { ...run, document: plan })
    console.log(plan)
  } finally {
    for (const [container, dir] of stages) {
      try {
        docker(['exec', '-u', '0', container, 'rm', '-rf', '--', dir])
      } catch {
        console.warn(`Warning: could not remove temporary directory ${dir} in ${container}.`)
      }
    }
  }
}

export function runBuilderRequest(args) {
  try {
    main(args)
  } catch (error) {
    if (typeof error.status === 'number') throw new Error('Builder command failed. See the stage diagnostic above.')
    throw error
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    runBuilderRequest(process.argv.slice(2))
  } catch (error) {
    console.error(error.message)
    process.exitCode = 1
  }
}

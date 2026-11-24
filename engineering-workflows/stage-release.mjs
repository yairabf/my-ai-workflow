import { execFileSync } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const source = fileURLToPath(new URL('../', import.meta.url))
const name = '@yairabf/ew'
const version = '1.0.0'
const registry = 'https://npm.pkg.github.com'

try {
  if (process.argv.length !== 3) {
    throw new Error('Usage: node engineering-workflows/stage-release.mjs <new-staging-directory>')
  }
  const destination = resolve(process.argv[2])
  const git = (args) => execFileSync('git', ['-C', source, ...args], {
    maxBuffer: 32 * 1024 * 1024,
  })
  const commit = git(['rev-parse', 'HEAD']).toString().trim()
  if (!/^[a-f0-9]{40}$/.test(commit)) throw new Error('Cannot identify the release source commit.')
  const original = JSON.parse(git(['show', `${commit}:package.json`]))
  const archive = git(['archive', commit, '--', 'package.json', ...original.files])
  mkdirSync(destination)
  execFileSync('tar', ['-x', '-f', '-', '-C', destination], { input: archive })

  const manifestPath = join(destination, 'package.json')
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
  delete manifest.private
  delete manifest.repository
  Object.assign(manifest, {
    name,
    version,
    bin: { ew: manifest.bin['engineering-workflows'] },
    publishConfig: { registry, access: 'restricted' },
    engineeringWorkflowsRelease: { sourceCommit: commit },
  })
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n')
  console.log(`Staged ${name}@${version} from ${commit}`)
} catch (error) {
  console.error(`Engineering Workflows release: ${error.message}`)
  process.exitCode = 1
}

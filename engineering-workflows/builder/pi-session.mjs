import { spawn } from 'node:child_process'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const cache = join(homedir(), '.npm/_npx')
const bins = existsSync(cache)
  ? readdirSync(cache)
      .map((id) => join(cache, id, 'node_modules/.bin/pi'))
      .filter(existsSync)
  : []
const prompt = readFileSync(process.argv[2], 'utf8')
const extension = fileURLToPath(new URL('workspace-tool.mjs', import.meta.url))
const child = spawn(
  bins.length === 1 ? bins[0] : 'pi',
  [
    '--offline',
    '--no-session',
    '--no-approve',
    '--no-context-files',
    '--no-themes',
    '--no-prompt-templates',
    '--no-extensions',
    '--no-mcp',
    '--no-skills',
    '--extension',
    extension,
    '--no-builtin-tools',
    '--tools',
    'workspace',
    '-p',
  ],
  { stdio: ['pipe', 'pipe', 'inherit', 1, 0] },
)
const ended = new Promise((resolve, reject) => {
  child.once('error', reject)
  child.once('close', resolve)
})
child.stdin.end(prompt)
let result = ''
for await (const chunk of child.stdout.setEncoding('utf8')) result += chunk
const code = await ended
if (code !== 0 || !result.trim()) throw new Error('Pi returned no successful role handoff.')
console.log(JSON.stringify({ result: result.trim() }))

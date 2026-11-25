import { spawn, spawnSync } from 'node:child_process'
import { createInterface } from 'node:readline'

export async function roleSession(reader, staging, prompt, container) {
  const args = ['exec', '-i', reader]
  const path = staging + '/role-prompt.md'
  const save = spawnSync('docker', [...args, 'sh', '-c', 'umask 077; cat > "$1"', 'sh', path], { input: prompt })
  if (save.status !== 0) throw new Error('Could not stage role inputs.')
  const child = spawn('docker', [...args, 'node', staging + '/builder/pi-session.mjs', path], {
    stdio: ['pipe', 'pipe', 'inherit'],
    timeout: 600000,
  })
  const ended = new Promise((resolve, reject) => {
    child.once('error', reject)
    child.once('close', resolve)
  })
  let result
  try {
    for await (const line of createInterface({ input: child.stdout })) {
      const message = JSON.parse(line)
      if (typeof message.result === 'string') {
        result = message.result
        continue
      }
      if (typeof message.command !== 'string' || result !== undefined) throw new Error('Invalid Pi tool request.')
      const run = spawnSync('docker', ['exec', container, 'sh', '-c', message.command], {
        encoding: 'utf8',
        timeout: 120000,
        maxBuffer: 1024 * 1024,
      })
      const status = run.error?.code ?? run.signal ?? run.status
      const log = (run.stdout ?? '') + (run.stderr ?? '')
      const tail = log.length > 24000 ? '[output truncated]\n' + log.slice(-24000) : log
      const output = 'exit ' + status + '\n' + tail
      child.stdin.write(JSON.stringify({ output }) + '\n')
    }
    if ((await ended) !== 0 || !result) throw new Error('Role session ended without a handoff.')
    return result
  } finally {
    child.kill()
  }
}

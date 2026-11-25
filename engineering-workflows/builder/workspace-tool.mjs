// Pi runs on the signed-in reader. Its only tool sends commands to the
// operator's adapter, which executes them in a separate role container.
import { readSync, writeSync } from 'node:fs'

export default function workspaceTool(pi) {
  pi.registerTool({
    name: 'workspace',
    label: 'Role workspace',
    description: 'Run a shell command in the assigned role workspace.',
    parameters: { type: 'object', properties: { command: { type: 'string' } }, required: ['command'] },
    async execute(_call, { command }) {
      writeSync(3, JSON.stringify({ command }) + '\n')
      const bytes = []
      const byte = Buffer.alloc(1)
      while (readSync(4, byte, 0, 1) === 1 && byte[0] !== 10) bytes.push(byte[0])
      const { output } = JSON.parse(Buffer.from(bytes).toString())
      return { content: [{ type: 'text', text: output }] }
    },
  })
}

import { execFileSync } from 'node:child_process'
import { copyFileSync, lstatSync, mkdtempSync, realpathSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { isAbsolute, join, relative, resolve } from 'node:path'
import { createLsToolDefinition, createReadToolDefinition } from '@earendil-works/pi-coding-agent'

// The caller allows only these extension tools. If loading fails, built-in
// filesystem and shell tools remain disabled.
export default function projectReader(pi) {
  const target = realpathSync(process.env.EW_READER_TARGET)
  for (const tool of [createReadToolDefinition(target), createLsToolDefinition(target)]) {
    pi.registerTool({
      ...tool,
      name: 'project_' + tool.name,
      async execute(call, input, ...rest) {
        const path = realpathSync(resolve(target, input.path ?? '.'))
        const local = relative(target, path)
        if (
          local === '..' ||
          local.startsWith('../') ||
          isAbsolute(local) ||
          local.split('/').includes('.git')
        ) {
          throw new Error('Choose a project file inside the selected checkout.')
        }
        return tool.execute(call, { ...input, path }, ...rest)
      },
    })
  }
  pi.registerTool({
    name: 'project_graph_query',
    label: 'Query project graph',
    description: 'Search the selected checkout’s existing Graphify graph by node or concept.',
    parameters: { type: 'object', properties: { question: { type: 'string' } }, required: ['question'] },
    async execute(call, { question }) {
      const graph = join(target, 'graphify-out', 'graph.json')
      if (!lstatSync(graph, { throwIfNoEntry: false })?.isFile() || realpathSync(graph) !== graph) {
        throw new Error('No regular graphify-out/graph.json in the checkout. Use project_read or project_ls.')
      }
      // Graphify can log queries beside the graph. Query a private copy so
      // repository configuration and query logs stay outside this operation.
      const scratch = mkdtempSync(join(tmpdir(), 'ew-graph-'))
      try {
        const copy = join(scratch, 'graph.json')
        copyFileSync(graph, copy)
        const text = execFileSync('graphify', ['query', question, '--graph', copy], {
          cwd: scratch,
          encoding: 'utf8',
          timeout: 30000,
          stdio: ['ignore', 'pipe', 'pipe'],
        })
        return { content: [{ type: 'text', text }] }
      } finally {
        rmSync(scratch, { recursive: true, force: true })
      }
    },
  })
}

import { realpathSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'
import { ticketIdentity } from './builder-project.mjs'
import { digest, InputError, openStore, operatorFile, requireInput } from './mission/store.mjs'

import { approve, issueUrl, record } from './mission/transitions.mjs'
import { showStatus } from './mission/status.mjs'

const pack = realpathSync(fileURLToPath(new URL('../', import.meta.url)))
const usage = `Usage: node engineering-workflows/mission-controller.mjs --state DIR COMMAND
  submit OWNER/REPO ISSUE MISSION.md [--at REVISION]
  status [OWNER/REPO ISSUE]
  record KIND FILE.md --at REVISION
  approve PLAN_FILENAME --at REVISION

Kinds: ready, brief, clarification, plan, plan-feedback, candidate, review,
       evidence, repair, continue, delivery, head-changed`

function identity(repository, number) {
  try {
    return ticketIdentity(repository, number)
  } catch (error) {
    throw new InputError(error.message)
  }
}

function submit(store, key, text) {
  const file = store.saveArtifact('mission', '# Mission\n\n' + issueUrl(key) + '\n\n' + text)
  return {
    ...key, file, stage: 'preparation', notes: [], plans: [], candidates: [],
    delivery: [], failedRepairs: 0, round: 0,
  }
}

function mutate(store, revisions, command, operands, at) {
  const latest = revisions[0] ?? 0
  requireInput(at !== undefined || command === 'submit',
    'Supply --at with the revision shown by status.')
  const previous = at === undefined ? 0 : Number(at)
  requireInput(String(previous) === (at ?? '0') && Number.isSafeInteger(previous) && previous >= 0 &&
    previous < Number.MAX_SAFE_INTEGER, 'Expected a valid revision in --at.')

  let payload
  if (command === 'submit') {
    requireInput(operands.length === 3, usage)
    payload = [identity(...operands.slice(0, 2)), operatorFile(operands[2])]
  } else if (command === 'record') {
    requireInput(operands.length === 2, usage)
    payload = [operands[0], operatorFile(operands[1])]
  } else {
    requireInput(operands.length === 1, usage)
    payload = operands
  }

  const request = digest(JSON.stringify([command, ...payload]))
  if (revisions.includes(previous + 1) && store.read(previous + 1).request === request) {
    console.log('Already accepted at revision ' + (previous + 1) + '.')
    return
  }

  requireInput(previous === latest, 'State advanced. Run status before trying again.')
  let mission = latest ? store.read(latest).mission : null
  if (command === 'submit') {
    requireInput(!mission || mission.stage === 'delivered', 'A mission is already active. Run status to resume it.')
    mission = submit(store, ...payload)
  } else {
    requireInput(mission, 'No saved mission. Use submit first.')
    if (command === 'record') record(mission, ...payload, store)
    else approve(mission, payload[0], store)
  }
  requireInput(store.save(latest + 1, request, mission), 'State advanced. Run status before trying again.')
  showStatus(store, store.read(latest + 1))
}

function main(args) {
  let parsed
  try {
    parsed = parseArgs({
      args, allowPositionals: true,
      options: { state: { type: 'string' }, at: { type: 'string' }, help: { type: 'boolean' } },
    })
  } catch (error) {
    if (!error.code?.startsWith('ERR_PARSE_ARGS_')) throw error
    throw new InputError(usage)
  }
  const { values, positionals: [command, ...operands] } = parsed
  if (values.help) return console.log(usage)
  requireInput(values.state && ['submit', 'status', 'record', 'approve'].includes(command), usage)
  const store = openStore(values.state, pack, command === 'submit')
  const revisions = store.revisions()
  if (command === 'status') {
    requireInput(operands.length === 0 || operands.length === 2, usage)
    const key = operands.length ? identity(...operands) : null
    for (const revision of revisions) {
      const saved = store.read(revision)
      if (!key || (saved.mission.repository === key.repository && saved.mission.number === key.number))
        return showStatus(store, saved, revision === revisions[0])
    }
    throw new InputError('No saved mission matches this request. Check --state and the ticket identity.')
  }
  mutate(store, revisions, command, operands, values.at)
}

try {
  main(process.argv.slice(2))
} catch (error) {
  console.error(error instanceof InputError ? error.message :
    'Mission controller failed unexpectedly' + (error.code ? ' (' + error.code + ')' : '') + '. Check the input files and state directory.')
  process.exitCode = 1
}

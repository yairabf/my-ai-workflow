import { createHash, randomUUID } from 'node:crypto'
import {
  linkSync, lstatSync, mkdirSync, readFileSync, readdirSync, realpathSync,
  unlinkSync, writeFileSync,
} from 'node:fs'
import { isAbsolute, join, relative, resolve, sep } from 'node:path'

export class InputError extends Error {}

export function requireInput(condition, message) {
  if (!condition) throw new InputError(message)
}

export function digest(value) {
  return createHash('sha256').update(value).digest('hex')
}

export function containsPath(parent, child) {
  const path = relative(parent, child)
  return path === '' || (!isAbsolute(path) && path !== '..' && !path.startsWith('..' + sep))
}

const states = new Set([
  'preparation', 'investigation', 'investigation-waiting', 'planning', 'planning-waiting', 'approval', 'implementation',
  'review', 'review-blocked', 'repair', 'repair-paused', 'delivery', 'delivery-head-changed', 'delivered',
])

const artifactName = /^[a-z-]+-[a-f0-9]{64}\.md$/

function publish(directory, name, contents) {
  const temporary = join(directory, '.pending-' + randomUUID())
  try {
    writeFileSync(temporary, contents, { flag: 'wx', mode: 0o600, flush: true })
    try {
      // A named revision can be published by only one writer, even after a restart.
      linkSync(temporary, join(directory, name))
      return true
    } catch (error) {
      if (error.code !== 'EEXIST') throw error
      return false
    }
  } finally {
    try {
      unlinkSync(temporary)
    } catch (error) {
      if (error.code !== 'ENOENT') throw error
    }
  }
}

export function operatorFile(path) {
  requireInput(lstatSync(path, { throwIfNoEntry: false })?.isFile(), 'Expected a regular Markdown input file.')
  const bytes = readFileSync(path)
  const text = bytes.toString('utf8')
  requireInput(text.trim() && Buffer.from(text).equals(bytes), 'Expected nonempty UTF-8 Markdown.')
  return text.replace(/\r\n/g, '\n')
}

export function openStore(path, pack, create) {
  const directory = resolve(path)
  requireInput(!containsPath(pack, directory), 'Choose a state directory outside the workflow pack checkout.')
  requireInput(!lstatSync(directory, { throwIfNoEntry: false })?.isSymbolicLink(), 'Choose a state directory without a symbolic link at its final component.')

  if (!lstatSync(directory, { throwIfNoEntry: false })) {
    requireInput(create, 'No mission state here. Use submit or check --state.')
    const parent = realpathSync(resolve(directory, '..'))
    requireInput(!containsPath(pack, parent), 'Choose a state directory outside the workflow pack checkout.')
    mkdirSync(directory, { recursive: true, mode: 0o700 })
  }
  requireInput(lstatSync(directory).isDirectory(), 'Expected a mission state directory.')
  const root = realpathSync(directory)
  requireInput(!containsPath(pack, root), 'Choose a state directory outside the workflow pack checkout.')

  function revisions() {
    return readdirSync(root)
      .map((entry) => /^mission-([1-9]\d*)\.json$/.exec(entry))
      .filter(Boolean)
      .map((match) => Number(match[1]))
      .sort((left, right) => right - left)
  }

  function artifact(name) {
    requireInput(artifactName.test(name), 'Invalid handoff reference in saved state.')
    const file = join(root, name)
    requireInput(lstatSync(file, { throwIfNoEntry: false })?.isFile(), 'Saved handoff is missing. Restore it before proceeding.')
    const contents = readFileSync(file)
    requireInput(name.endsWith(digest(contents) + '.md'), 'Saved handoff was changed. Restore it before proceeding.')
    return file
  }

  function read(revision) {
    const path = join(root, 'mission-' + revision + '.json')
    const invalid = 'Invalid mission state at revision ' + revision + '. Restore the saved record before proceeding.'
    requireInput(lstatSync(path, { throwIfNoEntry: false })?.isFile(), invalid)
    let saved
    try {
      saved = JSON.parse(readFileSync(path, 'utf8'))
    } catch (error) {
      if (error instanceof SyntaxError) throw new InputError(invalid)
      throw error
    }
    requireInput(saved?.revision === revision && saved?.version === 1 &&
      /^[a-f0-9]{64}$/.test(saved.request) && validMission(saved.mission), invalid)
    for (const name of handoffs(saved.mission)) artifact(name)
    return saved
  }

  return {
    root, artifact, read, revisions,
    saveArtifact(kind, contents) {
      const name = kind + '-' + digest(contents) + '.md'
      publish(root, name, contents)
      artifact(name)
      return name
    },
    save(revision, request, mission) {
      return publish(root, 'mission-' + revision + '.json',
        JSON.stringify({ version: 1, revision, request, mission }, null, 2) + '\n')
    },
  }
}

function validMission(mission) {
  return mission && states.has(mission.stage) && typeof mission.repository === 'string' &&
    Number.isSafeInteger(mission.number) && mission.number > 0 && typeof mission.file === 'string' &&
    Array.isArray(mission.notes) && Array.isArray(mission.plans) &&
    Array.isArray(mission.candidates) && Array.isArray(mission.delivery) &&
    Number.isSafeInteger(mission.failedRepairs) && mission.failedRepairs >= 0 &&
    Number.isSafeInteger(mission.round) && mission.round >= mission.failedRepairs &&
    mission.notes.every((note) => typeof note?.file === 'string') &&
    mission.plans.every((plan) => typeof plan?.file === 'string') &&
    mission.candidates.every((candidate) => typeof candidate?.file === 'string' &&
      typeof candidate.evidence === 'string' && typeof candidate.sha === 'string' &&
      Number.isSafeInteger(candidate.round) && candidate.round >= 0 &&
      (!candidate.round || (typeof candidate.requestedBy?.file === 'string' && typeof candidate.requestedBy.sha === 'string')) &&
      Array.isArray(candidate.reviews) && candidate.reviews.every((review) => typeof review?.file === 'string')) &&
    mission.delivery.every((result) => typeof result?.file === 'string') &&
    hasStageInputs(mission)
}

function hasStageInputs(mission) {
  const { stage, ready, brief, plans, candidates, delivery } = mission
  if (stage === 'preparation') return true
  if (typeof ready?.file !== 'string' || typeof ready.base !== 'string' || typeof ready.checkout !== 'string') return false
  if (stage === 'investigation-waiting') return mission.notes.at(-1)?.kind === 'investigation-question'
  if (stage === 'investigation') return true
  if (typeof brief !== 'string') return false
  if (stage === 'planning-waiting') return mission.notes.at(-1)?.kind === 'planning-question'
  if (stage === 'planning') return true
  if (!plans.length) return false
  if (stage === 'approval') return true
  if (typeof plans.at(-1).approved !== 'string') return false
  if (stage === 'implementation') return true
  if (!candidates.length) return false
  if (stage === 'review') return true
  if (stage === 'delivery-head-changed') return delivery.length > 0
  if (!candidates.at(-1).reviews.length) return false
  return stage !== 'delivered' || delivery.length > 0
}

function handoffs(mission) {
  return [
    mission.file, mission.ready?.file, mission.brief,
    ...mission.notes.map((note) => note.file),
    ...mission.plans.flatMap((plan) => [plan.file, plan.approved]),
    ...mission.candidates.flatMap((candidate) => [candidate.file, candidate.evidence, candidate.requestedBy?.file, ...candidate.reviews.map((review) => review.file)]),
    ...mission.delivery.map((result) => result.file),
  ].filter((name) => name !== undefined)
}

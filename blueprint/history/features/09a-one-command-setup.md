# Feature: One-command setup

**From build-plan:** feature 9a
**Build attempt:** 1
**Branch:** `feature/one-command-setup`
**Status:** verified

## Goal

Set up Engineering Workflows and all six prerequisites from the target Git
project with one pinned command and existing GitHub credentials. A successful
setup leaves the roles ready to use in a harness whose readiness is verified.

## In scope

- Fetch and run the pinned Engineering Workflows CLI through `npx` from the
  target Git root without a preexisting pack checkout.
- Register `workflow-initiate` and `workflow-investigate` and prepare Graphify,
  Grill Me, thermonuclear code quality review, Taste, Impeccable, and UI UX Pro
  Max in that run for Pi, OpenCode, Claude Code, and Codex.
- Reuse working installations and preserve conflicting content. Report which
  prerequisite, runtime, or path needs repair.
- Check harnesses automatically where reliable discovery is available.
  Leave other harnesses pending until their first discovery check. Installed
  skills are available for that check without another installation step.
- Keep same-revision reruns safe and the local-checkout installer usable.

## Out of scope

- Upgrades between pinned pack revisions, covered by feature 9b.
- Installing or authenticating harnesses, configuring Git credentials,
  publishing to an npm registry, and selecting an unpinned default revision.
- Starting a mission, running design or review tasks, modifying agent settings,
  and enabling optional Graphify hooks, guards, watchers, or services.

## Build loop

Work on the recorded branch after spec approval. Check each step as it lands
and present the whole feature after verification. Checkpoint commits are
disabled. Use `/complete` for the final feature commit.

## Build steps

- [x] **1. Make the GitHub package runnable.** Add the npm metadata and
  executable for setup. Reuse the existing Git-root validation, role
  registration, and revision tracking. Prove the packaged path resolves the
  complete role bundle and its source commit. **Done when** `npx` runs the
  binary from a pinned Git source into a fresh disposable checkout and
  installs both roles with adapters, references, and the exact revision,
  leaving the target's dependency files and Git index unchanged.
- [x] **2. Prepare all prerequisites in that run.** Follow the shipped
  preparation checklist for source pins, resources, normal harness paths,
  and required runtimes. Check for working installations before fetching
  or copying. **Done when** the same invocation installs all six
  prerequisites for all four harnesses, preserves working files on
  rerun, and reports invalid destinations, conflicts, unavailable
  sources, and missing tools without overwriting existing files.
- [x] **3. Check readiness and document the command.** Run supported
  discovery and runtime checks and reuse the readiness marker. Document
  first-run and repeat behavior in the pack quickstart and workflow.
  **Done when** the command reports ready, pending, or repair-needed
  outcomes, records actual verification, and leaves pending harnesses
  needing only discovery when first used. Exercise the documented path
  from a fresh Git project and verify the installed Investigator handoff.
- [x] **4. Repair the independent-review findings.** Verify the declared
  UI UX Pro Max search path and run a read-only query with the reviewed
  pinned scripts. Verify that both workflow roles resolve to the checkout's
  installed procedures and required resources. **Done when** a broken search
  or a shadowing role cannot record readiness, a customized search bundle
  remains pending manual verification, and the pinned setup still passes.
- [x] **5. Verify prerequisite read access.** Check that required resource
  files can be read and preserve the failing file path in diagnostics.
  **Done when** an unreadable existing Graphify reference leaves the
  affected harnesses unready, and recovery succeeds after restoring access.

## Files / areas

- npm package metadata and executable entry point, located where npm can
  discover them when running against the pinned repository revision.
- The [checkout installer](../../engineering-workflows/install.mjs) and
  installed role bundles under `engineering-workflows/`.
- [Initiate preparation](../../engineering-workflows/.agents/skills/workflow-initiate/references/preparation.md),
  [readiness](../../engineering-workflows/.agents/skills/workflow-initiate/references/readiness.md),
  and its `scripts/marker.mjs`.
- [Pack README](../../engineering-workflows/README.md) and
  [development workflow](../../engineering-workflows/workflows/development.md).

## Data / contracts

**Command.** The documented entry accepts a pinned GitHub revision and uses
the current working directory as the target Git root. The expected shape is:

```sh
npx --yes --package='git+ssh://git@github.com/yairabf/my-ai-workflow.git#<commit>' -- engineering-workflows setup
```

Document the GitHub access, Git, Node.js, and npm requirements, and how to
select the published commit. Use existing Git credential handling. Report the
affected source or operation on fetch failures without exposing credentials.

**Installation.** Preserve the role IDs, skill paths, pinned prerequisite
sources, bundled resources, and runtime checks from Feature 15. Keep the
Graphify CLI installation at user level when missing, using a documented
available tool manager. Prepare checkout-local registrations for missing
skills and reuse discoverable working copies. Leave existing project
instructions, npm manifests and lockfiles, harness configuration, and the
Git index as found. Preserve the installed source commit as
newline-terminated UTF-8 in `.engineering-workflows/revision.txt`. Derive
it from the pinned source and verify it through the npm entry. Report a
different installed revision before replacing files.

**Results and readiness.** Report a status for each harness and the subject
and path of each actionable failure. Incomplete required installation
returns nonzero. Successful installation can report discovery pending.
Keep the existing checkout-local Git metadata marker and harness IDs.
Record readiness only after actual discovery, definition readability,
and required runtime checks. Preserve valid historical entries when
recording a new harness. A historical entry cannot bypass a failed
current check. An invalid or unreadable marker withholds readiness and
identifies the marker path.

## Testing

- Exercise the pinned npm entry from a fresh target without a pack checkout.
  Verify the revision, both roles and their handoff, the six prerequisites,
  and discovery for available harnesses. If hosted access cannot be exercised,
  use a pinned Git fixture through npm and record the hosted path as unverified.
- Exercise same-revision repeats, a different installed revision, invalid and
  unwritable targets, conflicting existing files, unavailable sources or
  tools, and absent or unverifiable harnesses. Check exit statuses and
  resulting files and readiness state.
- Exercise the local-checkout installer, run `git diff --check HEAD`, and run
  `node --check` for changed JavaScript helpers. No Verify command is configured.

Disposable verification used npm 12.0.2 and Node 26.7.0 with a full-SHA
`git+file://` package pin. Setup fetched the four declared upstream Git
sources, staged the existing Graphify CLI's skill, and registered both
roles and all six prerequisites. Codex and OpenCode discovered the roles
and prerequisites and were recorded as ready. Pi and Claude Code were
absent and stayed pending. The installed Investigator and brief resolved
through the installed layout. The unpublished GitHub package entry was
not tested against the hosted repository.

The same-revision repeat preserved installed bytes and timestamps. A
different pinned revision, an invalid or unwritable target, an incomplete
existing skill, an invalid readiness marker, an unavailable pinned source,
and a missing Graphify CLI with neither tool manager produced the expected
diagnostics and nonzero statuses. No test modified an app dependency file
or staged target files. The original role-only installer passed separately.

The repaired pinned npm setup ran the actual UI UX Pro Max search and
recorded Codex and OpenCode as ready. A broken advertised script path
returned nonzero without creating a marker. A customized script bundle
reported pending without creating a marker. A same-named role discovered
by OpenCode reported its conflicting path and recorded readiness only for
the unaffected Codex harness.

An ordinary-user fixture with both existing Graphify query references at
mode 000 reproduced the original false-ready result. The repaired pinned
npm setup reported both unreadable paths and wrote no readiness marker.
After restoring read access, setup reused the registrations and recorded
Codex and OpenCode as ready.

## Notes for the AI

- Keep the source pins and registration requirements shared with Initiate.
  Reuse the existing installer and marker logic, and use the existing Git
  and tool-manager commands.
- Report live discovery only for harnesses with observable evidence in
  the test environment. Feature 3 retains the two-session OpenHands pilot.


<!-- blueprint:completion {"schemaVersion":2,"specBytes":9290,"specSha256":"4eb254b891ee3902331f6c704d021ba70c58c79beb429dafd2c92385c41e55d7","branch":"refs/heads/feature/one-command-setup","head":"9714d0bf03c05ed438f3481dfd8037004e94da39","baseRef":"refs/heads/main","baseCommit":"44a3da6cfb1f9ac88dc00049f21eef4155ecbebf","sourceTree":"c5d4a91ac60a038333c9b6d9b77bba2ef13eafc4","landing":"local-merge","absentOptional":[]} -->

## Findings

### 9a/F-01 [P1] closed - UI UX Pro Max can be marked ready with an unusable search command

**File:** engineering-workflows/readiness.mjs:137
**Found:** 2026-11-20 by /audit (scope: current; lenses: quality, tests)
**Why it matters:** The Python probe reads a CSV using independent inline code. It never validates the search command in the discovered definition or uses its search implementation. A working CSV alongside broken script paths or a broken search module therefore produces the same passing result as a working installation. The shipped readiness procedure requires a read-only skill query and matching script paths.
**Suggested fix:** Verify the command and query against a known pinned bundle. For other discovered copies where running their code is inappropriate, report pending until the normal harness check confirms the query.
**Resolution:** Setup checks the advertised script path and runs the real keyboard search with hash-verified scripts and the discovered data in a temporary directory. Pinned setup passed. A broken path reported repair with no marker, and a customized script reported pending without recording readiness. Independent review confirmed the advertised-path check, script hashes and parsed query results at the repaired checkpoint.

### 9a/F-02 [P1] closed - A shadowing workflow role can receive the checkout readiness marker

**File:** engineering-workflows/readiness.mjs:8
**Found:** 2026-11-20 by /audit (scope: current; lenses: quality, tests)
**Why it matters:** Both roles have empty required-file lists. Verification accepts any discovered directory with the role name in its frontmatter. A profile role of the same name can therefore pass even if it lacks the installed Investigator procedure and investigation brief. Setup then records the harness as ready for the handoff.
**Suggested fix:** Check that each discovered role resolves to its installed role or matching bundled content with its required procedures and references. Report a conflicting discovered path.
**Resolution:** Setup checks the discovered role paths against the installed procedures and validates required role resources. A same-named OpenCode role reported its conflicting path and only the unaffected Codex harness was recorded. Independent review confirmed the discovered-role realpath comparison, exact installed role trees and shared resource checks.

### 9a/F-03 [P1] closed - Readiness accepts unreadable Graphify references

**File:** engineering-workflows/prerequisites.mjs:38
**Found:** 2026-11-20 by /audit (scope: current; lenses: quality, tests)
**Why it matters:** An existing nonempty Graphify reference can have readable metadata while the setup user lacks permission to read its contents. The resource loop only inspects metadata. The later Graphify version probe checks the executable, so both checks succeed and the harness can receive a readiness marker even though it cannot read the references required by the readiness procedure.
**Suggested fix:** Check read access to required resources and preserve the failing resource path in the diagnostic. Exercise the existing-registration case with an unreadable reference under an ordinary user and confirm the affected harness stays unready.
**Resolution:** Required resource files and the Grill Me companion now pass an explicit read-access check. A mode-000 Graphify fixture reproduced the original false-ready result, then confirmed repaired setup names both denied paths and writes no readiness marker. Restoring read access let the same setup pass and record both available harnesses. Independent review confirmed the read-access checks run during preparation and discovery, retain the failed path, and prevent the affected harness from being recorded.

## Independent review
**Status:** passed
**Target commit:** 9714d0bf03c05ed438f3481dfd8037004e94da39
**Base commit:** 44a3da6cfb1f9ac88dc00049f21eef4155ecbebf
**Base ref:** main
**Spec hash:** 4eb254b891ee3902331f6c704d021ba70c58c79beb429dafd2c92385c41e55d7
**Prepared by:** codex
**Builder model:** unknown (runtime did not expose exact model)
**Requested reviewer:** codex
**Requested model:** gpt-6.2-astra
**Requested execution:** automatic
**Requested at:** 2026-11-20T13:05:36Z
**Workflow:** regular
**Check required:** no
**Reviewer adapter:** codex
**Reviewer model:** gpt-6.2-astra
**Reviewer context:** fresh subagent
**Actual execution:** automatic
**Reviewed at:** 2026-11-20T13:06:56.224859+00:00
**Scope:** current
**Lenses:** quality, security, performance, tests
**Verdict:** passed
**Check result:** not-required

## Commands

- `git status --short --branch --untracked-files=all`, `git rev-parse HEAD`, `git merge-base main HEAD`, and `shasum -a 256 blueprint/context/current-feature.md` matched the request.
- `git diff --check main...HEAD` and `git diff --check HEAD` passed.
- `node --check` passed on install.mjs, setup.mjs, prerequisites.mjs and readiness.mjs. The setup help entry and JSON parsing passed.
- `npm pack --offline --dry-run --ignore-scripts --json` listed 21 files including the executable, role adapter, prerequisite manifest and bundled Grill Me and Grilling definitions.

## Evidence

- Reviewed the full 14-file checkpoint delta, including plans, spec, pack and preparation instructions, manifest, installer, CLI, registration and readiness code. Compared callers against the installed readiness procedure and project coding standards.
- F-03 closed. Existing and discovered registrations check read access before verification succeeds. The permission-error path is retained and affected harnesses cannot enter the marker update. The spec records denial and recovery under an ordinary user.
- Rechecked F-01 and F-02. Automatic verification checks the advertised search path, hashes the staged scripts and parses a real query, and validates discovered roles against installed definitions and resources.
- Reviewed setup subprocesses, source pins, destination checks, repeat behavior, bounded command timeouts and recorded fixture coverage. No new blocking finding or skipped, focused or placeholder test was identified.

## Findings

- F-03 closed. F-01 and F-02 remain closed. No new findings.

## Remaining risk

- No test, lint, build, or Verify command is configured. This review inspected the reported pinned local npm fixture evidence. Hosted GitHub invocation and interactive Pi and Claude Code discovery remain unverified.

## Try it now

Run or do:

```sh
node engineering-workflows/setup.mjs --help
```

Expected:

`Usage: engineering-workflows setup`

This proves:

The CLI entry point loads and reports its usage without installing files.

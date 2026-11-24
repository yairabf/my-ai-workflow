# Feature: Safe upgrades

**From build-plan:** feature 9b
**Build attempt:** 1
**Branch:** feature/safe-upgrades
**Status:** verified

## Goal

Let a Git project with Engineering Workflows installed move to another pinned
source revision through an explicit upgrade command. Preserve local edits and
keep the recorded revision accurate when an upgrade cannot finish.

## In scope

- Add `engineering-workflows upgrade` to the existing package CLI. Run it
  from the target Git root using the package pinned to the desired revision.
- Support existing installations that record only the source commit in
  `.engineering-workflows/revision.txt`.
- Apply upstream additions, updates, executable-mode changes, and removals to
  pack-owned files. Cover the shared and Claude role directories, bundled
  prerequisite sources, and the installed Engineering Workflows CI file.
- Preserve nonoverlapping local changes. Report all overlapping paths before
  writing any changes to the target.
- Retain the existing setup and readiness workflow for fresh installations and
  same-pin setup retries.

## Out of scope

- Publishing or changing private package distribution under feature 9c.
- Automatic text merges, forced replacement, or interactive conflict resolution.
- Upgrading independently installed prerequisites, harness configuration, or
  the Graphify runtime. Existing prerequisite discovery and readiness commands
  remain the way to check active prerequisite registrations.
- Changes to project instructions, repository-owned CI, the Git index, or
  builder pin selection.

## Build loop

Implement on the recorded branch after spec approval. Verify each step through
the relevant local entry point and present one review after all steps. The
project config uses feature-level review and disables checkpoint commits.
`/complete` creates the final feature commit after the applicable gates.

## Build steps

- [x] **Resolve the old and new pins and build a read-only upgrade plan.** Use
  the existing CLI source revision resolver for the incoming pin and recover
  the old managed files from the exact installed commit. Check how prior pack
  layouts materialized those files before using them as the comparison base.
  Scope the comparison to pack-owned paths, validate destination path types
  using the installer's existing path rules, and plan file changes before
  applying them.

  **Done when** a local fixture with two pinned source commits identifies safe
  additions, updates, mode changes, and removals, keeps unchanged local content
  out of the change set, and reports every conflicting path. Missing or invalid
  pins, an unavailable exact baseline, and unsafe destinations fail without
  changes to managed files or the revision stamp.

- [x] **Apply the plan through the package CLI.** Wire the explicit command,
  reuse the installer's staging and path handling where applicable, and
  recheck affected paths before replacing or removing them. Keep the old stamp
  until all file changes succeed. Recover from handled write failures without
  discarding local edits and make a retry recognize files already equal to the
  desired revision. Keep the legacy role-only entry point and setup behavior
  compatible.

  **Done when** an upgrade through the pinned package CLI updates clean files
  and the stamp together, keeps edits at untouched paths, and leaves the target
  unchanged when it detects conflicts during preflight. A failed apply keeps
  the prior stamp and can be retried safely. Requesting the currently recorded
  pin succeeds as a no-op.

- [x] **Document the command and exercise existing entry points.** Show how to
  supply a new Git pin, interpret conflicts, and retry after resolving them.
  Explain which paths the pack manages. Verify setup can still install a fresh
  checkout, reuse matching files on a same-pin run, and direct a cross-pin
  request to the explicit upgrade command.

  **Done when** the documented command matches the CLI, the fixture scenarios
  below pass, and `bash .github/scripts/engineering-verify` passes.

- [x] **Repair F-01 for managed path type changes.** Plan file and directory
  replacements in dependency order. Preserve local descendants and refuse
  paths that alias another installed spelling.

  **Done when** pinned CLI fixtures pass both transition directions, report a
  retained local descendant without writes, restore the old layout after an
  injected stamp failure, and retry successfully. The fixtures passed locally
  and in the OpenHands writer container.

## Files / areas

- `engineering-workflows/setup.mjs` owns CLI dispatch and incoming pin
  validation.
- `engineering-workflows/install.mjs` owns managed paths, target checks,
  installation, and upgrade behavior.
- `engineering-workflows/prerequisites.mjs` consumes the bundled prerequisite
  sources. Preserve its reuse of existing registrations.
- `engineering-workflows/README.md` documents installation and upgrade.
- `engineering-workflows/builder/stage.mjs` reads the recorded source commit.
  Preserve the format and meaning it relies on.

## Data / contracts

- Store a full lowercase 40-character Git commit SHA followed by a newline in
  `.engineering-workflows/revision.txt`. Continue accepting the prior
  installer's stamp. Use the existing pin verification for both Git packages
  and release manifests.
- Use the installed commit as the comparison baseline. Obtain its managed
  contents from the pack source at that exact commit. If the baseline cannot
  be verified, report the pin and the failed lookup and leave the installation
  as it was.
- Compare file existence, bytes, and executable bits. For each path changed
  upstream, apply the incoming state if the current state matches the old
  state. If it already matches the incoming state, reuse it. Otherwise report
  a conflict, including local deletions or additions that overlap an upstream
  change. Preserve local changes where the old and incoming states match.
- A legacy role-only install can have no CI file. Leave an absent CI
  destination alone during upgrade. An existing CI file is eligible for
  replacement only when it matches the old managed file or the incoming file.
- Validate managed paths and use the Git worktree as the write boundary.
  Refuse unexpected path types or parent links that make comparison or writes
  unsafe. Delete only verified pack files removed upstream. Keep directories
  that contain local files.
- On success, report the old and new pins, or report that the requested pin
  is already installed. On failure, exit nonzero and identify the failed path
  or operation. Report preflight conflicts together and keep the old stamp on
  failure.

## Testing

- Use temporary Git projects and two local commit-pinned pack revisions to
  exercise the packaged CLI. Cover clean upgrade, no-op, nonoverlapping local
  edits, overlapping edits, conflicting additions and deletions, upstream
  removals, mode changes, unsafe paths, and an unavailable old pin.
- Include a legacy role-only install and a setup install with the CI file.
  Verify unrelated files and the Git index through before-and-after comparison.
  Exercise a handled write failure and a safe retry. Check the pin and file
  contents after each failed run.
- Exercise fresh setup and same-pin setup retry. Run
  `bash .github/scripts/engineering-verify` for final verification. The
  planning baseline passed this command. There is no configured test runner.

## Notes for the AI

Keep the upgrade path inside the existing installer and CLI. Reuse the same
managed path definitions for setup and upgrade so they agree about ownership.
Use the established upstream source and Git tooling to recover the baseline for
legacy installs. Keep temporary baseline and staging files out of the project
contents. Preserve prerequisite discovery and builder behavior.


<!-- blueprint:completion {"schemaVersion":2,"specBytes":7880,"specSha256":"55d239503b419317fb7e00e087ac599d76bd3159ccba468ec18443f236ffc013","branch":"refs/heads/feature/safe-upgrades","head":"8280484a69543793e91aedb5d85dfd3a16d0f4ed","baseRef":"refs/heads/main","baseCommit":"3967af36ba96e8d3012e433b342586dec8ee8eb5","sourceTree":"6cac52e31f4ab923934cfc9f32d45fd70da37d31","landing":"local-merge","absentOptional":[]} -->

## Findings

### 9b/F-01 [P1] closed - Clean file-to-directory replacements cannot upgrade

**File:** engineering-workflows/upgrade.mjs:97
**Found:** 2026-11-24 by /audit (scope: current; lens: quality)
**Why it matters:** If a revision removes a managed file and adds a child at the same name, the existing clean file is still present when targetFile validates the child's parents during preflight. targetPath throws before the planned removal can run. In the inverse transition, readFile rejects the still-existing directory at the incoming file path. Both are ordinary combinations of upstream additions and removals. A clean installation cannot advance to the new pin.
**Suggested fix:** Account for planned removals when checking the destination tree, order dependent file and empty-directory removals before additions, and treat retained local descendants as conflicts. Exercise both transitions and a retained local descendant.
**Resolution:** The planner orders verified removals before directory and file additions. The expanded pinned CLI fixtures passed locally and on OpenHands, including both transitions, a retained child, rollback, and partial retry. Independent review reran the local commit-pinned CLI fixtures and confirmed both replacement directions, retained-child protection, rollback and retry.

## Independent review
**Status:** passed
**Target commit:** 8280484a69543793e91aedb5d85dfd3a16d0f4ed
**Base commit:** 3967af36ba96e8d3012e433b342586dec8ee8eb5
**Base ref:** main
**Spec hash:** 55d239503b419317fb7e00e087ac599d76bd3159ccba468ec18443f236ffc013
**Prepared by:** codex
**Builder model:** unknown (runtime did not expose exact model)
**Requested reviewer:** codex
**Requested model:** gpt-6.2-astra
**Requested execution:** automatic
**Requested at:** 2026-11-24T14:15:32Z
**Workflow:** regular
**Check required:** no
**Reviewer adapter:** codex
**Reviewer model:** gpt-6.2-astra
**Reviewer context:** fresh subagent
**Actual execution:** automatic
**Reviewed at:** 2026-11-24T14:17:14Z
**Scope:** current
**Lenses:** quality, security, performance, tests
**Verdict:** passed
**Check result:** not-required

## Commands

- `git rev-parse HEAD`, `git merge-base main HEAD`, `git status -sb`, and `shasum -a 256 blueprint/context/current-feature.md` confirmed the request and its allowed evidence changes.
- `EW_VERIFY_BASE=3967af36ba96e8d3012e433b342586dec8ee8eb5 bash .github/scripts/engineering-verify` passed.
- `NPM_CONFIG_OFFLINE=true python3 /tmp/ew-safe-upgrade-transition-check.py` passed using temporary local Git repositories and pinned npm packages.

## Evidence

- Reviewed all five changed paths, including the active spec, README commands, CLI dispatch, installer ownership definitions, and upgrade planning, application and recovery. Checked historical installer layout, builder stamp consumption and release staging. The current pack is small and processing runs during an explicit CLI operation.
- Local CLI fixtures verified both path transitions, clean setup and retry, CI ownership, unchanged local edits and index, aggregated conflicts, path type and spelling checks, missing baseline and stamp failure recovery. The fresh run confirmed F-01 is closed.
- No skipped, focused or placeholder tests in the checkpoint. Reviewed repository validation and error standards. Dependencies and generated files were outside the product delta.

## Findings

- F-01 closed. No new findings.

## Remaining risk

- No configured repository test runner. The supplemental CLI fixture was available outside the repository. Private hosted Git authentication and forced termination were outside the local run.

## Try it now

Run `node engineering-workflows/setup.mjs --help` from the pack checkout.

The usage line lists `<setup|upgrade>`. This shows the command is advertised.

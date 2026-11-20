# Feature: Initiate target repository

**From build-plan:** feature 15
**Build attempt:** 1
**Branch:** `feature/initiate-target-repository`
**Status:** verified

## Goal

Give the operator one installable workflow pack for initiating and
investigating an authorized target Git checkout in Pi, OpenCode, Claude Code,
or Codex. Later missions can skip setup when their selected harness has
verified readiness and the required skills remain available.

## In scope

- Ship Initiate and the existing read-only Investigator together under
  `engineering-workflows/`. Add a minimal Git-and-Node installer that
  registers `workflow-initiate` and `workflow-investigate` from a pinned pack
  checkout and includes their references and local prerequisite sources.
- Prepare Graphify, Grill Me, thermonuclear code quality review, Taste,
  Impeccable, and UI UX Pro Max for every target checkout, including repositories
  without UI work.
- Reuse working installations and install missing skills from the sources below.
  Prefer checkout-local registration. If the Graphify CLI is missing, use its
  documented user-level installation.
- Prepare skill locations for all four harnesses. Verify readiness individually
  for each available harness and let the operator proceed with a ready harness
  while others are pending or need repair.
- Provide the operator with a readiness result and next action for each harness.
  Keep the Investigator's target access read-only.

## Out of scope

- Installing or authenticating agent harnesses, running the OpenHands pilot
  from feature 3, and opening an Investigator or Planner session automatically.
- Adding Planner, Implementer, or Reviewer skills, and automated upgrades
  between pack revisions.
- Running investigation, generating a Graphify graph, or applying the review
  and design skills during setup.
- Enabling optional Graphify watchers, guards, hooks, or background services.

## Build loop

Work in the recorded branch after spec approval. Check each step as it lands and
present the completed feature for review under `workflow.stepReview = feature`.
Checkpoint commits are disabled. Use `/complete` for the final feature commit.

## Build steps

- [x] **1. Define the Initiate entry point and prerequisite preparation.**
  Add the shared skill and its Claude Code adapter. Validate the operator's
  target as an accessible Git checkout before writing. Document the four
  harnesses' checkout-local skill locations or supported loading paths and
  Graphify installation steps. Use shared skill locations where the harness
  supports them. Reuse complete installations and prepare only missing pieces.
  **Done when** an authorized disposable checkout can be prepared from the
  declared sources, existing working copies are preserved, and an invalid
  target or failed install identifies the failed operation without recording
  readiness.
- [x] **2. Verify readiness and persist it per harness.** Check that each
  available harness can discover and load all six skills through its normal
  entry path, including required bundled resources and runtimes. Record each
  verified harness in the checkout marker and report absent harnesses as
  pending. Distinguish unavailable verification from a passed check.
  **Done when** a successful harness is recorded, an absent or failing harness
  is excluded, and one harness's failure leaves another verified harness
  usable. Adding a harness later can record its readiness through the same
  entry point.
- [x] **3. Document and exercise repeat mission entry.** Add a short operator
  entry in the README, including initial setup, the quick readiness check,
  repair reporting, and the handoff to the read-only Investigator.
  **Done when** a ready harness with a valid marker skips installer and marker
  writes, a recorded harness with a missing prerequisite reports the exact
  repair before investigation, and an absent or invalid marker cannot grant
  readiness. Follow the documented path in a disposable checkout and record
  which harnesses were exercised.
- [x] **4. Package the two roles and verify installation.** Move Initiate
  and Investigator into the Engineering Workflows source package. Add the
  checkout-local installer, Claude Code entry points, and a development
  workflow guide. Exercise the documented install and handoff in a fresh Git
  project. **Done when** both roles are discoverable by the available
  harnesses, the installed Initiate can prepare or check prerequisites
  without its source checkout, and a ready mission reaches the installed
  read-only Investigator and its brief template. A repeat installation
  preserves matching files and a conflicting installation reports its path.
- [x] **5. Repair the independent-review findings.** Check all missing
  installation destinations for write and traversal access before
  registering any role or resource. Align the project overview with the
  six-item prerequisite checklist. **Done when** a fresh target with a
  writable shared skill path and an unwritable Claude path gets a diagnostic
  without any registration or marker writes, and normal installs still pass.

## Files / areas

- `engineering-workflows/.agents/skills/` for the canonical procedures and
  their references and helpers, and `engineering-workflows/.claude/skills/`
  for the Claude Code entry points.
- `engineering-workflows/install.mjs` and its README and development guide
  for installation, version tracking, and the
  [Investigator handoff](../../engineering-workflows/workflows/development.md).
- `README.md` for the link to the installable pack.
- Target checkout skill locations, the checkout's local Git metadata, and the
  operator-level Graphify tool environment when installation is needed.

## Data / contracts

**Installation.** Run the installer from a clean source checkout at the
desired Git revision and pass the target Git root. Copy the shared skills,
Claude Code adapters, and the Grill Me source bundle into their documented
target paths. Write the source commit as UTF-8 text ending in a newline at
`.engineering-workflows/revision.txt`. Reuse identical installed paths and
report any conflict before installing. Installation uses target files only
and leaves the readiness marker, agent configuration, and Git index alone.

**Inputs and outputs.** The operator provides the target checkout and identifies
the harness for the mission. Initiate reports which harnesses are ready, pending
because the harness is absent, or require repair. For a failure, include the
harness, prerequisite or operation that failed, and what the operator needs to
address. If the target cannot be validated or setup lacks write access, report
that blocker before writing. Surface an unavailable source or runtime as an
explicit failure for each affected harness.

**Sources.** Keep a single prerequisite checklist in the shared Initiate
procedure. Preserve each skill's required assets, scripts, references, and
license notices when registering it.

| Prerequisite | Source |
| --- | --- |
| Graphify | Official [`graphifyy` package](https://pypi.org/project/graphifyy/), which provides the `graphify` CLI and harness registration. |
| Grill Me | `.agents/skills/grill-me/` and its sibling `.agents/skills/grilling/` from the same workflow-pack revision as Initiate, bundled at installation under the target's `.engineering-workflows/prerequisites/`. |
| Thermonuclear code quality review | [Cursor Thermos skill](https://github.com/cursor/plugins/blob/50b3a3234bf2e0293849a48784d72030948e44ee/thermos/skills/thermo-nuclear-code-quality-review/SKILL.md) at the approved commit. |
| Taste | [`design-taste-frontend`](https://github.com/Leonxlnx/taste-skill/tree/f6b76575f949707b4e3c37cd86cb44b0b98643e8/skills/taste-skill) with its bundled resources. |
| Impeccable | [`impeccable`](https://github.com/pbakaus/impeccable/tree/b49177d32788f2dc585c42831d845dacf1ebed2c) at the pinned revision, using the upstream harness layouts for Codex, Claude Code, OpenCode, and Pi. |
| UI UX Pro Max | [`ui-ux-pro-max`](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill/tree/2de1134dc4d1cfe112934611ae5803ae17a1bd7e/.claude/skills/ui-ux-pro-max) with its bundled data, scripts, and references. Use the documented Python runtime for its search check. |

**Marker.** Resolve the checkout-local path from the target root with
`git rev-parse --git-path ai-workflow-initiate.json`. Store UTF-8 JSON with
`schemaVersion` equal to the integer `1` and `verifiedHarnesses` as a list
of unique strings drawn from `pi`, `opencode`, `claude-code`, and `codex`.
A clean first run writes the marker only once at least one harness has verified
all six prerequisites. When recording another harness, preserve the existing
entries and replace the file atomically. A missing marker leaves readiness
unverified. Malformed JSON, an unsupported schema, or invalid harness IDs block
fast entry and require a diagnostic before reinitialization.

**Repeat entry.** A valid marker and a passing quick check of all six
prerequisites in the selected harness permit direct investigation. If the
selected recorded harness fails the quick check, report the prerequisite or
runtime that needs repair and stop before investigation. Rerun verification
after repair. A harness newly available on the machine can use the prepared
skills once it passes verification and its entry is recorded. The marker is
local to the checkout and stays out of Git commits.

## Testing

- Use a disposable Git checkout to exercise missing and existing prerequisites,
  unavailable installer inputs, an absent harness, and invalid targets and
  markers. Verify the normal discovery path for each available harness and
  record actual results, including unavailable harnesses.
- Exercise repeat entry with a verified marker, a newly available harness,
  and a missing prerequisite. Confirm the ready path leaves the marker and
  installed files untouched and the failed path stops before investigation.
- Install the pack into a fresh Git checkout from a clean source snapshot.
  Verify role discovery, the self-contained Initiate-to-Investigator handoff,
  the installed brief template, an idempotent reinstall, and conflict handling.
- Check Markdown links, paths, and commands and run `git diff --check HEAD`.
  If implementation adds a JavaScript helper, run `node --check` and exercise
  its documented entry point. This repository has no configured Verify command.

Disposable checkout evidence: Graphify 0.9.50 prepared the skill without
project hooks. Codex CLI 0.170.0 and OpenCode 1.18.30 discovered the installed
definitions. Both UI UX Pro Max bundle locations returned search results.
Pi and Claude Code were absent, so their registrations were prepared and left
pending verification. Marker checks covered merging verified harnesses,
skipping writes on a ready repeat, reporting a missing UI UX Pro Max skill
without changing the marker, and rejecting invalid markers and targets.

Pack verification used a clean source snapshot and a separate fresh target.
The installer recorded the revision, skipped matching files on repeat, and
rejected a conflicting Claude Code adapter before writing other locations.
With the source checkout moved away, OpenCode and Codex discovered both
installed roles and all six prerequisites. A read-only exercise resolved
the installed Investigator and its brief template, cited evidence from the
target README, and left the target's files unchanged.

A disposable checkout with a mode-0555 Claude skill directory reproduced
the original partial-install failure. The repaired installer reported the
denied parent before writing shared roles, resources, or readiness state.
Normal installation and a repeat installation passed after restoring access.

## Notes for the AI

- Confirm checkout-local Graphify registration and normal skill discovery for
  each harness in step 1 before documenting its command. Use the normal
  harness loading mechanism and retain the folder layout required by bundled
  scripts and relative links.
- Start with Markdown instructions and existing Git, harness, and upstream
  tooling. Add a helper only for an operation the procedure cannot reliably
  complete using those tools.
- Verify readiness without invoking a design, audit, or investigation task in
  the target checkout. Keep the full two-session Pi pilot in feature 3.


<!-- blueprint:completion {"schemaVersion":2,"specBytes":12404,"specSha256":"9fc3a6e431a19a70af28d951f801af962c52ca2d18f6b61b3b1db3aa2a656925","branch":"refs/heads/feature/initiate-target-repository","head":"5256af8137ccbf0836881d1d7c57b7766695b3d3","baseRef":"refs/heads/main","baseCommit":"bb057b7fc2d227df401fe1106499fe785d68d8c4","sourceTree":"f2b5fd89842e9c001e7b0c5ead1691aa00a22e97","landing":"local-merge","absentOptional":[]} -->

## Findings

### 15/F-01 [P1] closed - Installer can publish roles before detecting an unwritable destination

**File:** engineering-workflows/install.mjs:105
**Found:** 2026-11-20 by /audit (scope: current; lens: quality)
**Why it matters:** The approved input contract requires reporting insufficient target write access before writing. With a writable shared skill root and a readable, non-writable existing Claude skill root, the missing destinations all pass the existence checks. The loop then installs both shared roles before staging the first Claude adapter fails. This leaves discoverable roles without their bundled prerequisites or revision.
**Suggested fix:** Before registering any missing directory, check write and traversal access on the nearest existing parent of every missing destination. Exercise a mixed-permissions target and confirm the failed invocation leaves the target untouched.
**Resolution:** The installer checks the nearest existing parent for write and traversal access for every missing destination before registration. A disposable checkout reproduced the partial install on the reviewed checkpoint. The repaired run named the unwritable Claude skill path and left the target unchanged. Normal and repeat installs passed after restoring access. Independent reviewer repeated the denied-parent, successful install and reinstall cases at 5256af8 and confirmed closure.

### 15/F-02 [P3] closed - Project overview still describes three prerequisites

**File:** blueprint/context/project-overview.md:20
**Found:** 2026-11-20 by /audit (scope: current; lens: quality)
**Why it matters:** The project's source of truth describes recording completion after checking three named skills. The installed role and feature 15 require six. The overview also retains a TODO at line 95 for the now-defined marker and checks.
**Suggested fix:** Refer to the six-item preparation checklist and replace the obsolete TODO with the readiness reference.
**Resolution:** The overview now links to the six-item checklist and the completed readiness reference. Independent review confirmed both local links resolve and the checklist contains all six prerequisites.

## Independent review
**Status:** passed
**Target commit:** 5256af8137ccbf0836881d1d7c57b7766695b3d3
**Base commit:** bb057b7fc2d227df401fe1106499fe785d68d8c4
**Base ref:** main
**Spec hash:** 9fc3a6e431a19a70af28d951f801af962c52ca2d18f6b61b3b1db3aa2a656925
**Prepared by:** codex
**Builder model:** unknown (runtime did not expose exact model)
**Requested reviewer:** codex
**Requested model:** gpt-6.2-astra
**Requested execution:** automatic
**Requested at:** 2026-11-19T23:14:18Z
**Workflow:** regular
**Check required:** no
**Reviewer adapter:** codex
**Reviewer model:** gpt-6.2-astra
**Reviewer context:** fresh subagent
**Actual execution:** automatic
**Reviewed at:** 2026-11-19T23:15:13Z
**Scope:** current
**Lenses:** quality, security, performance, tests
**Verdict:** passed
**Check result:** not-required

## Commands

- `git rev-parse HEAD`, `git merge-base main HEAD`, `git status -sb`, and `shasum -a 256 blueprint/context/current-feature.md` passed freshness checks.
- `git diff --check main...HEAD` and `git diff --check HEAD` passed.
- `node --check` passed on the installer and marker helper.
- `node engineering-workflows/install.mjs <target>` and the installed marker helper's `show` and `record` commands passed disposable-checkout assertions, including expected failure cases.
- Python local Markdown link checks passed for the pack, root README and project overview.

## Evidence

- Reviewed all 15 changed paths from the recorded merge base through the target, including the relocated Investigator procedure and brief, both adapter entry points, prerequisite sources and discovery rules, marker handling, installer and project documentation. Review and findings records were excluded from the product delta.
- The mode-0555 Claude directory produced a diagnostic before shared roles or resources appeared. Restoring write access allowed installation, recorded the target SHA as the source revision, and allowed an identical reinstall.
- The installed marker helper reported an absent marker, merged two harnesses, preserved the timestamp on repeat registration, and rejected an invalid schema.
- The project overview links to the six-item checklist and readiness procedure. The Investigator keeps target access read-only. Reviewed discovery evidence recorded in the spec for Codex and OpenCode. No skipped, focused or placeholder automated tests appeared in the delta.

## Findings

- Closed F-01 and F-02. No new findings.

## Remaining risk

- No configured test, build, lint or Verify command. The disposable checks cover local helper behavior. This review did not independently repeat upstream installation or live harness discovery. The spec records Pi and Claude Code as unavailable.

## Try it now

Run or do:

From the workflow-pack root, run:

```sh
node engineering-workflows/.agents/skills/workflow-initiate/scripts/marker.mjs show "$PWD"
```

Expected:

`uninitialized` when this checkout has no readiness marker. A checkout with a
valid marker returns JSON listing its previously verified harnesses.

This proves:

The marker helper can read checkout-local readiness without writing a marker.

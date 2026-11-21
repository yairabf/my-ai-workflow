# Feature: GitHub delivery and CI

**From build-plan:** feature 7
**Build attempt:** 1
**Branch:** `feature/github-delivery-and-ci`
**Status:** verified

## Goal

Install GitHub Actions CI with Engineering Workflows. Give the coding agent
one follow-up path for project checks and OpenCodeReview findings, from the
reviewed candidate through a PR ready for a human merge decision.

## In scope

- Bundle a GitHub Actions workflow with the pack and install it from the
  normal `engineering-workflows setup` command. Use the currently available
  Git-pinned entry point for the pilot.
- Preserve existing workflows. Run the project's real Verify command in CI
  when its runtime, dependencies, and command are configured. Reuse an
  existing equivalent PR check where available.
- Run Alibaba OpenCodeReview on ready in-repository PRs and their updated
  commits. Treat findings as advisory during the pilot and make review
  configuration and execution failures visible.
- Define how the coding agent opens a PR with approved-plan and independent
  review evidence, reads CI and review results, and verifies the revised PR
  head. Keep the existing Thermo review in the pre-PR reviewer flow.
- Prove installation and PR follow-up in one GitHub pilot repository.

## Out of scope

- Bulk migration, deployment, automatic merges, branch protection changes,
  publishing a registry package, and upgrading an installed pack revision.
- Automatic secret provisioning, a hosted repair agent, and automatic model
  review of fork PRs during the pilot.
- Implementing the Planner, Implementer, or independent Reviewer role skills.
  The pilot takes their plan and independent review evidence as inputs.

## Build loop

Work on the recorded branch. Verify each step and present one feature-level
review. Step checkpoint commits are disabled. Use `/complete` after the
implementation and applicable gates pass.

## Build steps

- [x] **1. Bundle and install CI.** Ship the workflow inside the pack and
  register it at a dedicated path in `.github/workflows/` through normal setup.
  Reuse an identical copy on rerun. Leave an existing differing file intact
  and report its path. Reuse the installer's path and file safeguards.
  **Done when** the packed Git-based command installs the workflow with the
  skills in a disposable target, reruns recognize the installed workflow,
  and separate fixtures prove existing workflows, edits, and the Git index
  are preserved.
- [x] **2. Wire the PR checks.** Reuse project-owned Verify where available.
  For the pilot, provide real pack checks using the existing Git whitespace
  and Node syntax checks. Wire the official OpenCodeReview action, pinning
  the action commit and CLI version. Document provider setup, eligible PRs,
  and what to do when configuration is missing. **Done when** the workflow
  definition validates and the documented Verify command locally exercises
  the same checks that CI will run.
- [x] **3. Add the PR delivery and repair handoff.** Extend the canonical
  development workflow with a PR checklist and instructions for reading
  GitHub's check runs, failed-step logs, and OpenCodeReview findings. Record
  the commit each result applies to. **Done when** the handoff covers a green
  run, a failing check, a skipped or unavailable review, a confirmed or
  disputed finding, a superseded commit, and the human merge decision.
- [x] **4. Rehearse the pilot locally.** Run the documented Verify
  command, validate the installed workflow, and exercise its review setup
  diagnostics. **Done when** Verify passes valid code and catches both
  whitespace and syntax failures, the recipe check reports a missing script,
  and the review steps report missing configuration or an absent summary
  without exposing credentials.

## Live pilot acceptance after landing

After `/complete` lands the independently reviewed code, install from the
Git-pinned entry point in a fresh checkout of the pilot repository. Commit the
installed workflow to its default branch so the trusted review trigger is
available, and configure the Verify option and approved model in GitHub Actions.
Submit a reviewed PR with its approved plan, exact candidate commit, and
verification evidence. The pilot passes when GitHub runs Verify,
OpenCodeReview publishes its result, and the coding agent reads both results,
corrects a genuine or deliberately seeded problem, then confirms the new
commit's checks and review. Record the PR and check-run links. Leave the merge
decision to a human.

## Files / areas

- `engineering-workflows/setup.mjs` and the existing safe installer helpers.
- A workflow template under `engineering-workflows/`, shipped through the
  existing package allowlist, and a dedicated installed workflow under
  `.github/workflows/` in the target project.
- `engineering-workflows/README.md` and
  `engineering-workflows/workflows/development.md` for setup, project Verify,
  and the delivery handoff. The pilot's Verify command belongs in its own
  repository and is documented in its `AGENTS.md`.

## Data / contracts

**Installation.** Installation writes local files only. The generated workflow
becomes active after the project commits and pushes it to GitHub. Repeat setup
recognizes identical content. A conflicting destination reports its path and
remains intact. Preserve existing workflow files, repository configuration,
target manifests, and index entries.

**Verify.** Use the same configured project command locally and in Actions.
Project owners supply the runtime and dependency setup. Prefer an existing
equivalent PR check. If a project lacks a configured command or runtime recipe,
show that Verify still needs setup rather than reporting a successful check.
Document how to require the verified check through GitHub branch rules.

**OpenCodeReview.** Run advisory reviews on eligible PR commits using the
pinned action and CLI. Pass reviewed code to an approved configurable model
endpoint. Store credentials in GitHub Actions secrets, supply them only to the
review job, and keep them out of the installed files, installer, and logs. Use
GitHub's workflow token with read access to contents and write access to PRs in
the review job. Keep PR code execution in the secret-free Verify job. Missing
provider configuration, skipped reviews, failed reviews, and completed reviews
are distinct outcomes.

**Delivery.** The PR links the approved plan, reviewed commit, and local
verification evidence. The coding agent reads checks and findings for the
current PR head, verifies findings against the code, repairs confirmed issues,
and checks the resulting commit. If a repair changes a previously reviewed
candidate, use the existing independent-review handoff for the revised commit.
Use the Thermo reviewer for disputed findings where a fresh maintainability
review would help. Escalate unresolved issues to the human with evidence and
leave merging to them.

## Testing

- Check package contents and exercise install, rerun, and conflict behavior in
  disposable repositories with and without existing workflows.
- Run Git whitespace checks and Node syntax checks. Validate workflow syntax
  before pushing the pilot. Exercise missing Verify and review configuration.
- In the live pilot, collect the PR head SHA, Verify result, OpenCodeReview
  summary or threads, repair commit, and follow-up results. A local rehearsal
  alone cannot establish live review.

## Notes for the AI

The pack currently has no configured build, test, lint, or Verify command.
Use the real checks described above and preserve the existing package release
workflow. Choose the pilot's approved model endpoint before enabling live
review. Keep the rollout independent of private package publication.

## Local verification evidence

- The packaged Git installer added the CI workflow and both role definitions
  in fresh repositories with and without existing workflows. Rerun reused the
  installed files. A locally edited workflow and a symlinked workflow parent
  were rejected without modifying them or the index.
- `bash .github/scripts/engineering-verify` passed. In a disposable checkout it
  rejected separate whitespace and JavaScript syntax failures.
- `actionlint` and Bash syntax checks passed. Local execution of the workflow
  shell steps covered missing recipe, missing secret, unsupported protocol,
  valid configuration, and missing review summary. Hosted review and repair
  remain the live pilot acceptance checks.


<!-- blueprint:completion {"schemaVersion":2,"specBytes":8488,"specSha256":"f02a96280275e0d66bb32bdfe6d0c8ccae4e9e1099ce67f9b8b463dc3baa106b","branch":"refs/heads/feature/github-delivery-and-ci","head":"11b15b1cffad328b1dda6f897f35b894f81e586d","baseRef":"refs/heads/main","baseCommit":"37793a1bf8e0ad569f78ea045a503eac53a00a4b","sourceTree":"51e63c80005121af58aa7ad624d86430c0ecc92b","landing":"local-merge","absentOptional":[]} -->

## Independent review

**Status:** passed
**Target commit:** 11b15b1cffad328b1dda6f897f35b894f81e586d
**Base commit:** 37793a1bf8e0ad569f78ea045a503eac53a00a4b
**Base ref:** main
**Spec hash:** f02a96280275e0d66bb32bdfe6d0c8ccae4e9e1099ce67f9b8b463dc3baa106b
**Prepared by:** codex
**Builder model:** unknown (runtime did not expose exact model)
**Requested reviewer:** codex
**Requested model:** gpt-6.2-astra
**Requested execution:** automatic
**Requested at:** 2026-11-21T17:54:34Z
**Workflow:** regular
**Check required:** no

**Reviewer adapter:** codex
**Reviewer model:** gpt-6.2-astra
**Reviewer context:** fresh subagent
**Actual execution:** automatic
**Reviewed at:** 2026-11-21T17:55:23Z
**Scope:** current
**Lenses:** quality, security, performance, tests
**Verdict:** passed
**Check result:** not-required

### Commands

- `git merge-base main HEAD`, `git rev-parse HEAD`, `git status -sb`, and `shasum -a 256 blueprint/context/current-feature.md` passed checkpoint freshness checks.
- `EW_VERIFY_BASE=main bash .github/scripts/engineering-verify` passed.
- `bash -n .github/scripts/engineering-verify` and local `actionlint engineering-workflows/workflows/engineering-workflows.yml` passed.

### Evidence

- Reviewed the complete branch delta, installer and setup paths, package allowlist, workflow template, delivery instructions, project Verify recipe, and verified spec. The installer checks existing content before registering missing files.
- The workflow separates the read-only PR verification job from the pinned review action. Reviewed the job conditions and handling of missing settings and absent summary output.
- The spec records disposable installation, conflict and failure-path exercises. No skipped, focused, or placeholder tests appeared in the delta.

### Findings

- None

### Remaining risk

- Hosted Verify, provider review, and the repair and re-review cycle require the post-landing pilot. No project test runner is configured.

## Try it now

In a disposable Git checkout, run the Git-pinned Engineering Workflows setup
command from the pack README with the landed revision. Setup prints
`GitHub CI workflow: .github/workflows/engineering-workflows.yml`. Open that
file and confirm it contains both the Verify and OpenCodeReview jobs.

# Feature: Private package release

**From build-plan:** feature 9c
**Build attempt:** 1
**Branch:** `feature/private-package-release`
**Status:** verified

## Goal

Offer an authenticated, version-pinned setup command that works from a
target Git checkout without a machine-specific alias. The first release
is `@yairabf/ew@1.0.0` in GitHub Packages.

## In scope

- Package the existing Engineering Workflows installer and its bundled role
  and prerequisite resources for private GitHub Packages distribution.
- Support `npx @yairabf/ew@1.0.0 setup` from a signed-in target Git project.
  Install both workflow roles and all six prerequisites, preserve the
  existing installer checks, and record the exact release source commit.
- Provide a manually triggered GitHub Actions release from reviewed
  `main`. Publish privately and verify the registry command in a fresh
  target checkout after publishing.
- Document one-time read access for each machine and keep the existing
  GitHub commit-pinned and local-checkout setup paths available.

## Out of scope

- Public distribution, publication to npmjs.org, changing source repository
  visibility, and automatic publication on push.
- Creating or storing a personal registry credential for the operator.
- Cross-version upgrades and resolving local edits during upgrades, covered
  by 9b.

## Build loop

Work on the recorded branch, check each step, and present the whole feature
for review. Checkpoint commits are disabled. Use `/complete` to land the
reviewed work. The actual private release and live registry smoke check
follow landing on `main`.

## Build steps

- [x] **1. Stage the private release artifact.** Reuse the existing npm
  package contents and installer. Give the release artifact the approved
  scope, version, and npm executable. Record the exact source commit from
  the build checkout as release metadata while preserving the existing
  Git-based package entry. **Done when** a disposable pack contains both
  role layouts, their references and helpers, the declared prerequisite
  bundles, and the expected registry identity and source revision. Inspect
  the packaged file list before publication.
- [x] **2. Wire the versioned registry entry and document access.** Use the
  same setup path for installs, readiness, and repair diagnostics.
  Document registry routing, one-time authentication, the short command,
  and the Git fallback. **Done when** a disposable run of the staged
  registry artifact installs from the target Git root, records the exact
  source revision, preserves target manifests and the Git index, and
  handles missing or invalid package metadata with an actionable error.
  The existing Git-pinned command still passes.
- [x] **3. Add and verify the manual release workflow.** Publish from
  reviewed `main` using the repository-scoped workflow credential, with
  the publish destination fixed to GitHub Packages. Verify in a separate
  fresh Git checkout using authenticated read access. **Done when** pre-landing
  tests exercise staging and the workflow's first-publish, same-version rerun,
  conflict, and authorization failure paths without publishing.

- [x] **4. Reject malformed metadata types (F-01).** Require the registry
  version and source commit to be strings before pattern matching.
  **Done when** singleton arrays in either field fail with the metadata
  diagnostic before writing to a fresh Git target.

After landing, dispatch the first release from `main`. Release acceptance
requires that the workflow publishes the intended version privately and the
exact short command installs the roles and six prerequisites and records the
published source SHA. Confirm published version and visibility and record the
actual workflow outcome.

## Files / areas

- Root `package.json` as the existing Git-based package contract, with a
  release staging entry for the GitHub Packages artifact as needed.
- [Setup CLI](../../engineering-workflows/setup.mjs) and
  [installer](../../engineering-workflows/install.mjs).
- `.github/workflows/` for the manually triggered private release and smoke
  check, and [the pack README](../../engineering-workflows/README.md) for
  operator commands.

## Data / contracts

**Distribution.** Release `@yairabf/ew@1.0.0` to
`https://npm.pkg.github.com` with private visibility. Use the reviewed
`main` commit selected by the release workflow. Use an explicit version
and the platform's protected workflow credential. A rerun must preserve an
already published version and surface a different source commit as a
conflict. Confirm that staged artifact metadata, publish arguments, and
the install smoke check agree on the package version.

**Source revision.** The staged registry artifact carries the exact
40-character Git commit SHA derived from its build checkout. Its setup
entry validates its package identity and release metadata and uses that SHA
for the existing `.engineering-workflows/revision.txt` stamp. Git-based
execution retains the full requested and resolved commit comparison. A
registry run with missing or invalid metadata stops before writing the
target. The existing conflict behavior for another installed revision
still applies.

**Operator command.** After the one-time GitHub Packages registry login,
run `npx @yairabf/ew@1.0.0 setup` at the target Git root. Keep credentials
in the operator's npm configuration or the CI environment. The CLI must
not copy them into the target, package them, or echo them in diagnostics.
The command installs Initiate, Investigator, and the six prerequisite
groups from the current checklist. Report each harness as ready, pending,
or needing repair based on the existing checks.

## Testing

- Pack and inspect a disposable release artifact. Confirm the exact
  revision, expected package files, and absence of credentials or local
  installation artifacts. Exercise the setup entry from a fresh Git target
  and check the recorded revision and target dependency files.
- Exercise missing or malformed release metadata, the existing Git-pinned
  path, and rerun/conflict handling. Check script syntax and
  `git diff --check HEAD`. The project has no configured Verify command.
- After landing, run the real publish workflow and verify that the private
  package version is accessible to authenticated users. Run the exact
  documented command in a fresh Git checkout and record which harnesses
  actually verified.

## Notes for the AI

- Keep the repository's Git distribution entry usable. Stage registry-only
  changes in the release artifact so distribution metadata does not change
  the Git entry's semantics or require a local checkout.
- Reuse the current Git and Node installer paths and the CI-provided GitHub
  token. Limit write permission to the job that publishes.

## Verification evidence

- Executed the workflow's stage-and-inspect step with a disposable Git SHA.
  npm 12.0.2 packed 21 files, including both role layouts and the companion
  skills. The scoped manifest recorded that exact SHA and the restricted
  GitHub registry destination.
- The staged npm tarball installed in a fresh Git project, recorded the
  source SHA, and preserved the target manifest and index. Codex and
  OpenCode were ready. Pi and Claude Code were pending on this machine.
  The Git-pinned fixture passed with the updated CLI.
- Missing and malformed release metadata stopped before target writes.
  YAML and Bash syntax checks passed. Mocked registry calls covered first
  publish, an identical version rerun, a different-commit conflict, and an
  authorization failure. Live publication and registry verification remain
  the post-landing release acceptance gate.
- The setup CLI rejected malformed version and SHA arrays in a fresh Git
  target. Its only entry after each failed installation was `.git`.


<!-- blueprint:completion {"schemaVersion":2,"specBytes":7820,"specSha256":"8d47eaeaba14a40612f5453b0aa386213e3ef6ed74f142cc6017ea7ed19f00a9","branch":"refs/heads/feature/private-package-release","head":"5edacbedbacb4bbfcb818cc7e8aa080ce464b625","baseRef":"refs/heads/main","baseCommit":"9265b071eab14514ee3b5a7e78f003b7ea5b25fe","sourceTree":"465a433efed28657bf37d24f334ad7f7e1e84890","landing":"local-merge","absentOptional":[]} -->

## Findings

### 9c/F-01 [P1] closed - Malformed registry metadata reaches the installer

**File:** engineering-workflows/setup.mjs:30
**Found:** 2026-11-21 by /audit (scope: current; lens: quality, tests)
**Why it matters:** The version and source SHA patterns coerce JSON arrays to strings. An array containing one valid version or SHA passes the checks and reaches installation, violating the requirement to stop before target writes. An array revision also fails strict comparison against an existing string stamp for the same release.
**Suggested fix:** Require string types for both fields before pattern matching. Exercise single-element arrays as malformed inputs and verify the target remains untouched.
**Resolution:** Both fields now require strings. Direct CLI runs with either singleton-array field returned the metadata error and left the fresh Git target untouched. Independent review exercised the current validator with each singleton-array input and a valid control. Both malformed cases threw before the call to install. F-01 closed.

## Independent review

**Status:** passed
**Target commit:** 5edacbedbacb4bbfcb818cc7e8aa080ce464b625
**Base commit:** 9265b071eab14514ee3b5a7e78f003b7ea5b25fe
**Base ref:** main
**Spec hash:** 8d47eaeaba14a40612f5453b0aa386213e3ef6ed74f142cc6017ea7ed19f00a9
**Prepared by:** codex
**Builder model:** unknown (runtime did not expose exact model)
**Requested reviewer:** codex
**Requested model:** gpt-6.2-astra
**Requested execution:** automatic
**Requested at:** 2026-11-21T16:36:20Z
**Workflow:** regular
**Check required:** no
**Reviewer adapter:** codex
**Reviewer model:** gpt-6.2-astra
**Reviewer context:** fresh subagent
**Actual execution:** automatic
**Reviewed at:** 2026-11-21T16:37:14Z
**Scope:** current
**Lenses:** quality, security, performance, tests
**Verdict:** passed
**Check result:** not-required

### Commands

- `git rev-parse HEAD`, `git merge-base main HEAD`, `git status --short --branch`, and `shasum -a 256 blueprint/context/current-feature.md` matched the requested checkpoint.
- `git diff --check main...HEAD` and Node syntax checks on both changed scripts passed.
- A Node assertion harness evaluated the checkout's sourceRevision function. A valid manifest returned its commit. Singleton arrays in either field raised the expected metadata error.

### Evidence

- Reviewed all eight changed paths against the verified spec, the source package manifest, prerequisite installer, project standards, and usage model.
- The release stages tracked files from the recorded commit. The workflow serializes releases, checks package contents, restricts write access to the publish job, and checks the installed revision from a fresh target.
- Reviewed the verified spec's recorded pack, target installation, Git-pin fallback, and simulated publication outcomes. No skipped or focused tests appeared in the range.

### Findings

- F-01 closed. Both string type guards run before installation and preserve the valid registry and Git-pinned paths. No new findings.

### Remaining risk

- No configured project test or Verify command. Authenticated publication, actual registry visibility, and the fresh runner smoke check remain post-landing acceptance steps.

## Try it now

After the release workflow succeeds and your machine is signed in to GitHub
Packages, run this from the root of a fresh Git checkout.

```sh
npx @yairabf/ew@1.0.0 setup
```

Expect `Installed Engineering Workflows at <commit>` followed by the harness
statuses. The SHA in `.engineering-workflows/revision.txt` should match the
commit shown on the release workflow run.

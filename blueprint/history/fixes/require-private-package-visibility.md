# Fix: Require private package visibility

**Type:** Fix
**Status:** verified
**Branch:** `fix/require-private-package-visibility`

## The problem

The first release of `@yairabf/ew@1.0.0` passed the fresh-project setup
check, but GitHub reported public visibility. The workflow created the
package using the public repository's `GITHUB_TOKEN`. GitHub documents
that packages created this way inherit the workflow repository's
visibility. The preflight only checked whether the name was already
public, so it let first-time creation through. Commit `37793a1` reopened
9c after the failed run. The workflow is disabled.

[Release run](https://github.com/yairabf/my-ai-workflow/actions/runs/44926621910) ·
[GitHub Actions package defaults](https://docs.github.com/en/packages/managing-github-packages-using-github-actions-workflows/publishing-and-installing-a-package-with-github-actions#default-permissions-and-access-settings-for-packages-modified-through-workflows)

## The fix

Use an owner-run release from a clean, reviewed `main` revision. Reuse
`engineering-workflows/stage-release.mjs` and the existing artifact and
revision checks. Omit the public repository association from the staged
package manifest and retain the source SHA in release metadata. Document
the account-scoped first publish with an owner-supplied GitHub Packages
credential and the documented private default for an unlinked package.
Require positive evidence from GitHub that an existing package is private
before uploading another version and that the released package is private
before declaring success. An API or authentication error blocks the
release. Keep the public repository workflow disabled and remove its
ability to publish from that repository's `GITHUB_TOKEN`.

Retain the scoped package name, commit-pinned Git setup and upgrade
behavior, and exact source revision tracking. Current registry metadata
could not be read with the available credential. If the original name
is public, or GitHub will not accept the intended version, stop for an
owner decision on package recovery or identity. GitHub documents that a
public package cannot be switched back to private.

[GitHub package visibility and access](https://docs.github.com/en/packages/learn-github-packages/configuring-a-packages-access-control-and-visibility) ·
[GitHub npm registry](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-npm-registry)

## Build steps

- [x] Repair the release path in the workflow, staging helper, and
  `engineering-workflows/README.md`. **Done when** the public workflow
  cannot publish, the staged tarball retains its exact source SHA and
  carries no public repository association, and the documented path
  distinguishes an authenticated missing package from a public package
  or an unverifiable registry response.
- [x] Limit the smoke test token to downloading the pinned package
  (F-01). **Done when** the documented setup runs offline from the
  fresh npm cache and the CLI and its child process receive neither
  the token nor an authenticated npm config.

## Verify

- Run `bash .github/scripts/engineering-verify`, inspect the staged npm
  tarball, and exercise the release preflight with private, public,
  missing, and authentication-error responses without publishing.
- After an authorized release, confirm the package is private in
  GitHub's authenticated package metadata. Run the pinned
  `npx @yairabf/ew@<version> setup` command in a fresh Git project and
  check the installed roles, prerequisites, and recorded source SHA.
  Use that evidence to reconcile the existing 9c checkbox. Keep it open
  while either acceptance check is pending.

## Local verification evidence

- Project Verify, workflow YAML parsing, and Bash syntax checks passed.
- Local package inspection confirmed the expected files, exact source
  SHA, and absent repository association.
- Mocked GitHub responses covered private, public, internal, missing,
  authorization failures, wrong owner, and malformed and conflicting
  metadata.
- A local npm registry fixture required authentication for the pinned
  download. Offline setup then ran the CLI and its child without the
  token or an npm auth entry.


<!-- blueprint:completion {"schemaVersion":2,"specBytes":4229,"specSha256":"ec3b40625752a4b5de249dbb95faca3d9a7ff889e6dddc8ccc0f60786784e29b","branch":"refs/heads/fix/require-private-package-visibility","head":"07b99ef9640387d07a1015f679ca602036b4191a","baseRef":"refs/heads/main","baseCommit":"fec6a7e2de72a3ee0507fcfc480c5f7a03c67640","sourceTree":"b63a391195450636428090c889a6ee4bd6e4f46c","landing":"local-merge","absentOptional":[]} -->

## Findings

### require-private-package-visibility/F-01 [P1] closed - Registry smoke test passes the package credential to prerequisite processes

**File:** engineering-workflows/README.md:87
**Found:** 2026-11-24 by /audit (scope: current; lens: security)
**Why it matters:** The smoke block requires an exported owner PAT for npm and runs `npx ... setup` in the same environment. Setup runs prerequisite programs such as Graphify, a PyPI-distributed tool that setup can install, using the inherited environment (`engineering-workflows/prerequisites.mjs:16`, `:91`). A local probe confirmed that the Graphify child receives the credential. Those programs need no package access and gain the PAT's permissions, including read access to private packages and any additional scopes carried by the supplied PAT.
**Suggested fix:** Restrict the PAT to fetching the pinned package. Run setup with the credential and its npm auth configuration removed, while retaining the fresh project, exact version, and source SHA assertions.
**Resolution:** The recipe now fetches the pinned version into a fresh npm cache with scripts disabled, clears the token and the npm auth entry, then runs pinned setup offline. A local authenticated registry fixture confirmed that the fetch used the token and the setup CLI and its child did not receive it. Independent review repeated the authenticated fixture download and ran the packaged setup command after shutting down the registry. The actual CLI installed the expected roles and recorded the checkpoint SHA. The prerequisite child observed neither the token nor an npm auth entry.

## Independent review

**Status:** passed
**Target commit:** 07b99ef9640387d07a1015f679ca602036b4191a
**Base commit:** fec6a7e2de72a3ee0507fcfc480c5f7a03c67640
**Base ref:** refs/heads/main
**Spec hash:** ec3b40625752a4b5de249dbb95faca3d9a7ff889e6dddc8ccc0f60786784e29b
**Prepared by:** codex
**Builder model:** unknown (runtime did not expose exact model)
**Requested reviewer:** codex
**Requested model:** gpt-6.2-sol
**Requested execution:** automatic
**Requested at:** 2026-11-24T17:18:11Z
**Workflow:** regular
**Check required:** no
**Reviewer adapter:** codex
**Reviewer model:** gpt-6.2-sol
**Reviewer context:** fresh subagent
**Actual execution:** automatic
**Reviewed at:** 2026-11-24T17:20:22Z
**Scope:** current
**Lenses:** quality, security, performance, tests
**Verdict:** passed
**Check result:** not-required

## Handoff

Review the active spec and the complete `fec6a7e2de72a3ee0507fcfc480c5f7a03c67640..07b99ef9640387d07a1015f679ca602036b4191a` delta in a fresh
session or isolated subagent without the builder conversation. Run all Audit lenses from scratch.
Run Check when required above. Do not edit product code, accept findings, or
reuse the existing findings as the review scope.

## Commands

- `EW_VERIFY_BASE=fec6a7e2de72a3ee0507fcfc480c5f7a03c67640 bash .github/scripts/engineering-verify`: pass
- `bash -n .github/scripts/pack-engineering-workflows`: pass
- `bash .github/scripts/pack-engineering-workflows <temporary-output-directory>`: pass
- Ruby YAML parsing and workflow permission inspection: pass
- Local mocked visibility API and authenticated npm registry probes: pass

## Evidence

- Reviewed the complete base-to-target source, workflow, README and spec delta, and followed the setup and prerequisite callers that receive the process environment.
- The read-only workflow has no publish job or package write permission. The real tarball contains the expected roles, exact source commit, restricted manifest, and no repository association.
- Twelve mocked GitHub CLI cases covered pagination, private, public, internal, missing, metadata errors, owner mismatch and missing credentials.
- A local npm registry required authentication for the pinned tarball. With the registry shut down and credentials removed, the packaged setup installed the roles, recorded the target SHA, and ran a prerequisite child without the token or npm auth entry. Other third-party prerequisites were fixture inputs.

## Findings

- F-01 closed. No new findings.

## Remaining risk

- The repository has no configured test, lint, build, security-scan, or performance command.
- Live GitHub Packages visibility, upload, and the fresh-install check against the actual registry remain pending for feature 9c.

## Try it now

Run or do:

```bash
bash .github/scripts/pack-engineering-workflows "$(mktemp -d)"
```

Expected:

The command prints the path to `yairabf-ew-1.0.0.tgz` after validating the tarball.

This proves:

The local tarball carries the exact source SHA and omits the public repository association.

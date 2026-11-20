# Fix: Accept hosted GitHub package pins

**Type:** Fix
**Status:** verified
**Branch:** `fix/accept-hosted-github-package-pins`

## The problem

The documented pinned `npx` command fetched the published package at commit
`eb2200c575ed9096d8358763af811e2d37a39927`, then failed before installation.
npm 12.0.2 recorded the request as `github:yairabf/my-ai-workflow#<commit>`
and the resolved package as `git+ssh://git@github.com/yairabf/my-ai-workflow.git#<commit>`.
The two full commit IDs matched. The parser in
[`engineering-workflows/setup.mjs`](../../engineering-workflows/setup.mjs)
requires a `git+` prefix for both fields, so it rejected the normalized request.

## The fix

Accept npm's normalized GitHub shorthand alongside the existing Git URL form
for the requested package. Keep requiring a full commit SHA and equality
with the resolved Git commit. Preserve the local Git fixture path, the
existing installer behavior, and the target's revision record.

## Build steps

- [x] **Recognize the normalized requested pin.** Preserve validation of the
  resolved Git entry and compare both extracted commit IDs.
  **Done when** matching `github:` request and `git+ssh:` resolution accept
  the pin and a missing, shortened, or mismatched pin still fails.

## Verify

- Exercise the exact npm lockfile forms observed on GitHub in a disposable
  setup and check the recorded revision. Test invalid pins and the existing
  pinned Git fixture.
- Run `node --check engineering-workflows/setup.mjs` and
  `git diff --check HEAD`.
- After landing, run the documented hosted command against the new commit in a
  fresh Git checkout and confirm that it installs the exact selected revision
  and reports actual harness readiness.

A disposable invocation with the actual hosted npm metadata accepted the
matching full commit and recorded Codex and OpenCode readiness. Missing,
unpinned, short, and mismatched requests exited before installation. A
separate pinned `git+file` invocation installed and recorded its exact commit.
The live hosted retest remains a post-landing check.


<!-- blueprint:completion {"schemaVersion":2,"specBytes":2080,"specSha256":"d33b92bfc5bc8f2959a64e9fae1f544dd6d182443793f21ad6d0118b24e65f0b","branch":"refs/heads/fix/accept-hosted-github-package-pins","head":"cdf446ba20bd8b3deb79668cd64895a05f52f5d0","baseRef":"refs/heads/main","baseCommit":"eb2200c575ed9096d8358763af811e2d37a39927","sourceTree":"e0a093df037c3cc9212940dfb11b0bbb5bae2d46","landing":"local-merge","absentOptional":[]} -->

## Independent review
**Status:** passed
**Target commit:** cdf446ba20bd8b3deb79668cd64895a05f52f5d0
**Base commit:** eb2200c575ed9096d8358763af811e2d37a39927
**Base ref:** main
**Spec hash:** d33b92bfc5bc8f2959a64e9fae1f544dd6d182443793f21ad6d0118b24e65f0b
**Prepared by:** codex
**Builder model:** unknown (runtime did not expose exact model)
**Requested reviewer:** codex
**Requested model:** gpt-6.2-astra
**Requested execution:** automatic
**Requested at:** 2026-11-20T13:22:48Z
**Workflow:** regular
**Check required:** no
**Reviewer adapter:** codex
**Reviewer model:** gpt-6.2-astra
**Reviewer context:** fresh subagent
**Actual execution:** automatic
**Reviewed at:** 2026-11-20T13:23:28.822316+00:00
**Scope:** current
**Lenses:** quality, security, performance, tests
**Verdict:** passed
**Check result:** not-required

## Commands

- `git rev-parse HEAD`, `git merge-base main HEAD`, `git status --short --branch` and `shasum -a 256 blueprint/context/current-feature.md` confirmed freshness.
- `git diff --check main...HEAD`, `git diff --check HEAD` and `node --check engineering-workflows/setup.mjs` passed.
- `node engineering-workflows/setup.mjs --help` passed. Seven in-memory lockfile cases exercised the checkpoint parser using Node assertions.

## Evidence

- Reviewed the full delta in the active spec and setup entry point. Both hosted shorthand and the existing Git URL accepted matching full commits. Missing, branch, short and mismatched requests failed, as did a shorthand resolution.
- Validation precedes installation. The additional expression operates on one dependency string and adds no I/O. The verified spec records separate disposable installation and revision evidence.

## Findings

- None

## Remaining risk

- The repository has no configured test or Verify command. The documented live hosted installation against the new revision remains a post-landing check.

## Try it now

Run or do:

From a disposable Git checkout, substitute the landed full commit in the
documented setup command:

```sh
npx --yes --allow-git=root --package='git+ssh://git@github.com/yairabf/my-ai-workflow.git#<commit>' -- engineering-workflows setup
```

Expected:

Setup reports the exact selected commit and the status of each harness.

This proves:

The published CLI accepts npm's normalized GitHub request for a full commit pin.

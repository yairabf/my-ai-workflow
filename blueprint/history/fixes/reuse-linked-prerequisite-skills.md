# Fix: Reuse linked prerequisite skills

**Type:** Fix
**Status:** verified
**Branch:** `fix/reuse-linked-prerequisite-skills`

## The problem

Running one-command setup in this repository installs the workflow pack,
then reports repair needed for Claude Code's Grill Me and Grilling skills.
The tracked `.claude/skills/grill-me` and `.claude/skills/grilling` entries
are symlinks to readable, matching skill directories under `.agents/skills/`.
The prerequisite loop calls `targetPath`, whose directory-only check rejects
the links before the installed-skill validator runs.

## The fix

Check the parent path using the existing installer safeguards, then inspect
the existing prerequisite registration separately. Reuse a leaf symlink when
it resolves to a directory in the checkout and the existing skill validator
accepts that directory. Validate Grill Me's companion against the resolved
layout. Leave the link and target contents intact.

Keep the existing safeguards for write destinations and pack installation.
Diagnose dangling links, invalid or out-of-checkout targets, and symlinked
parents with the affected path. Harness readiness still requires the
configured discovery and runtime checks. Cross-revision pack upgrades
remain feature 9b.

## Build steps

- [x] **Recognize valid linked prerequisites.** Validate and reuse existing
  checkout-local directory links on the prerequisite path. **Done when**
  setup reuses this repository's linked skills without a repair result for
  either link and preserves both entries. Invalid links and symlinked parents
  still return an actionable error and create no replacement.

## Verify

- Run the setup entry in a disposable Git checkout with the two tracked link
  layouts. Check exit status, harness diagnostics, both symlink destinations,
  and timestamps or bytes before and after the same-revision rerun.
- Check dangling links, mismatched skill names, links outside the checkout,
  and linked parents. Confirm failures leave the existing files intact and
  create no replacement registrations through those paths.
- Run `node --check` on changed JavaScript files and `git diff --check HEAD`.

A pinned npm fixture reused both tracked link layouts and preserved the link
entries and target bytes and timestamps on rerun. Codex and OpenCode reported
ready. Claude Code was absent and remained pending. Dangling links, wrong
skill names, out-of-checkout links, and linked parents failed with the
relevant path and remained intact.


<!-- blueprint:completion {"schemaVersion":2,"specBytes":2493,"specSha256":"d48cb44bb0b89eee278d7ca2071e2999fa943112107983d60eae37d46f4ce1c3","branch":"refs/heads/fix/reuse-linked-prerequisite-skills","head":"e003ba41173cfdeffee9209618faa8e8b803f526","baseRef":"refs/heads/main","baseCommit":"bd900c2f779c4ca3a00e250eee2ad14a08a32621","sourceTree":"901fb429516ef683a00b3f2bd32a0096879ba25a","landing":"local-merge","absentOptional":[]} -->

## Independent review
**Status:** passed
**Target commit:** e003ba41173cfdeffee9209618faa8e8b803f526
**Base commit:** bd900c2f779c4ca3a00e250eee2ad14a08a32621
**Base ref:** main
**Spec hash:** d48cb44bb0b89eee278d7ca2071e2999fa943112107983d60eae37d46f4ce1c3
**Prepared by:** codex
**Builder model:** unknown (runtime did not expose exact model)
**Requested reviewer:** codex
**Requested model:** gpt-6.2-astra
**Requested execution:** automatic
**Requested at:** 2026-11-20T13:35:27Z
**Workflow:** regular
**Check required:** no
**Reviewer adapter:** codex
**Reviewer model:** gpt-6.2-astra
**Reviewer context:** fresh subagent
**Actual execution:** automatic
**Reviewed at:** 2026-11-20T13:36:12.853589+00:00
**Scope:** current
**Lenses:** quality, security, performance, tests
**Verdict:** passed
**Check result:** not-required

## Commands

- `git rev-parse HEAD`, `git merge-base main HEAD`, `shasum -a 256 blueprint/context/current-feature.md`, and `git status --short --branch` matched the pending request.
- `git diff --check main...HEAD`, `git diff --check HEAD`, and `node --check engineering-workflows/prerequisites.mjs` passed.
- A read-only Node invocation of the exported checkSkill function passed for both tracked Claude registration links using their manifest entries.

## Evidence

- Reviewed both changed files and followed setup, install, manifest, and readiness callers. The installer supplies a canonical checkout root. The registration loop validates the parent before looking up the leaf and only queues writes for absent registrations.
- Link resolution and companion validation take bounded work per installed skill. The source manifest supplies the registration names. Discovery and runtime checks still control harness readiness.
- The verified spec records a pinned setup fixture, same-revision rerun, preservation checks, and rejection of invalid layouts. There are no changed tests or skipped test cases in this checkpoint.

## Findings

- None

## Remaining risk

- The project declares no test, lint, build, or Verify command. The full setup fixture was reported in the spec and was not rerun during this read-only review. Live Claude discovery remained pending in that fixture.

## Try it now

Run or do:

From a fresh clone of this repository, substitute the landed full commit in the
setup command:

```sh
npx --yes --allow-git=root --package='git+ssh://git@github.com/yairabf/my-ai-workflow.git#<commit>' -- engineering-workflows setup
```

Expected:

Setup accepts the two tracked Claude Code links and reports each harness status.
The two entries still point to their existing shared skill directories.

This proves:

Setup reuses the repository's existing links without replacing them.

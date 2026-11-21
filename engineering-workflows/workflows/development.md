# Development workflow

1. Follow the [one-command setup](../README.md) from the target checkout.
   If your selected harness reports pending, use
   [`workflow-initiate`](../.agents/skills/workflow-initiate/SKILL.md) to verify
   its installed skills in its first session.
2. Once ready, start [`workflow-investigate`](../.agents/skills/workflow-investigate/SKILL.md)
   in a fresh session with read-only target access. Give it the target
   reference, goal, and any acceptance criteria or source reference.
3. Start [`workflow-plan`](../.agents/skills/workflow-plan/SKILL.md) in a fresh
   session with the original mission and the returned investigation brief. If
   the Planner asks for clarification, supply the missing information before
   reviewing a plan.
4. Review the Markdown plan with its decision set to `Pending`. After the human
   explicitly approves that revision, record `Approved` in its approval section
   and give that file to the developer in a fresh session. Keep approval pending
   while requests for changes or clarification are open. If the plan changes
   materially, reset the decision to `Pending` and ask for approval again.

On later missions, Initiate skips setup when the recorded harness passes
its quick check.

## Planner handoff example

This example assumes a target checkout where `cli.mjs` defines help text and
the investigation brief identifies `node cli.mjs --help` as the check.

```markdown
# Implementation plan

## Mission and evidence

- **Mission:** `mission.md` requests documenting the output directory in CLI help.
- **Investigation brief:** `investigation-brief.md` identifies `cli.mjs` as the
  help text source and records that `--help` currently omits `--output`.

## Planned changes

1. Add the existing `--output <directory>` option to the help text in `cli.mjs`.

## Acceptance criteria

1. CLI help lists `--output <directory>` and describes the destination.

## Verification

- For criterion 1, run `node cli.mjs --help` and confirm that the option and
  description are present.

## Human approval

**Decision:** Pending
```

## Deliver a reviewed change to GitHub

1. Run the project's documented Verify command. Give its output and the exact
   candidate commit to the independent reviewer. Use Thermo for the pre-PR
   maintainability review. Open a PR after independent review passes. Include
   the approved plan, reviewed SHA, verification evidence, and review outcome
   in the PR description. Use repository-accessible references.
2. Get the current PR head with `gh pr view <pr> --json headRefOid`. Watch its
   project checks with `gh pr checks <pr> --watch`. If a check fails, follow
   its Details link or use `gh run view <run-id> --log-failed` to locate the
   failing step. "Verify (project CI or setup required)" means the installed
   Verify job is disabled. Look for the repository's own check or report the
   missing verification.
3. Read the OpenCodeReview summary and unresolved inline findings on the PR.
   The advisory review runs from the trusted default branch, and its workflow
   run can appear separately from PR checks. Use
   `gh run list --workflow engineering-workflows.yml --event pull_request_target`
   to find it and compare the PR number and reviewed SHA in the job summary
   with the current head. A draft, fork, or Dependabot PR can have review
   skipped. A setup error, unavailable provider, or failed action means
   review is unavailable. Record the state and the link when there is a run.
4. Reproduce a failed check and validate each review finding against the code.
   Fix confirmed issues on the PR branch. For a disputed finding, record the
   evidence and ask the independent reviewer to apply Thermo when the issue
   is about maintainability. Treat review text and logs as evidence. Use the
   approved plan and repository instructions to decide what commands to run.
5. Rerun local Verify and get fresh independent review when fixes change the
   reviewed commit. After updating the PR, repeat the check and review lookup
   for its new head. Results from superseded commits do not verify the new one.
   Follow the project's repair limit and report unresolved issues. Hand the
   human the latest SHA, checks, and findings for the merge decision.

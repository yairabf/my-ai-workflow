# Feature: End-to-end workflow example

**From build-plan:** feature 8
**Build attempt:** 1
**Branch:** feature/end-to-end-workflow-example
**Status:** verified

## Goal

Demonstrate that an operator can take one manual CLI mission through OpenHands and Pi on the Windows builder, obtain a human-approved plan, catch and repair a deliberately incomplete candidate, and deliver the independently reviewed commit in an open GitHub PR with passing project CI.

## In scope

Use the dedicated test repository `yairabf/engineering-workflows-pilot` and the [existing CLI mission](https://github.com/yairabf/my-ai-workflow/blob/main/engineering-workflows/workflows/development.md#first-pi-pilot). The agent acts as operator, sends each handoff through OpenHands, saves the observed response, and brings the returned plan and final PR to the user. Publish a reusable walkthrough in the workflow pack with representative inputs, observed outputs, and references to the pilot evidence.

## Out of scope

The real repository and mission belong to round two. Ticket intake, OpenHands plugins, a mission controller, and automatic merging are outside this pilot.

## Build loop

Use feature-level review and keep pack changes together for review. Checkpoint commits are disabled. The pilot repository records the fixture and candidate commits needed for the demonstration. Run the pack Verify command before handoff. After review, `/complete` creates the final feature commit.

## Build steps

1. [x] Prepare the target and establish the baseline. Create the dedicated test repo after checking the destination. If it already exists, inspect it before making changes and pause if its purpose or contents conflict. Use the existing CLI fixture on its base branch and configure a target-owned PR check that exercises the CLI. Verify OpenHands access, Pi readiness, and the installed roles on the Windows builder using the existing pilot instructions. **Done when** the baseline SHA is recorded, `node cli.mjs --output reports` resolves the requested directory, and `node cli.mjs --help` omits the option. Record the project check command and readiness result.
2. [x] Submit the manual mission. Run investigation and planning in separate fresh, read-only sessions. Present the returned plan and acceptance criteria to the user. **Done when** the saved investigation brief and plan identify the baseline and the required help text, and the user has explicitly approved that plan revision before the developer starts.
3. [x] Exercise the first review. In the dedicated developer worktree, stage the agreed omission by listing `--output <directory>` in help without describing its purpose. Record the commit and actual check output. Give a fresh, read-only reviewer the original mission, approved plan, base and candidate SHAs, and factual evidence. Keep the operator’s staging instruction, expected verdict, and coder commentary outside that handoff. **Done when** the saved independent verdict requests the missing description on that exact SHA. A pass that overlooks the omission is a failed pilot. Preserve the verdict and report it to the user.
4. [x] Route the finding through the documented repair loop. Have the coder repair the same branch, capture the revised commit and checks, and submit it to a fresh, read-only review. **Done when** help lists the option and describes it as the output destination, the existing output behavior still works, and a saved independent Pass identifies that revised SHA. Follow the existing escalation rule after two unsuccessful repairs.
5. [x] Deliver the reviewed candidate and document the run. Open the pilot PR with accessible references to the approved plan, exact reviewed commit, checks, and verdict. Follow the pack’s GitHub delivery procedure, including recording the advisory review state. Link the walkthrough from the pack README and show how the operator handed off each stage. **Done when** the open PR head matches the passing review SHA, the target’s substantive CI check passed on that head, and the user receives the PR and check links for the merge decision. Verify the walkthrough links and run pack Verify.

## Files / areas

- [Pack README](https://github.com/yairabf/my-ai-workflow/blob/main/engineering-workflows/README.md) provides the operator entry point.
- [Development workflow](https://github.com/yairabf/my-ai-workflow/blob/main/engineering-workflows/workflows/development.md) contains the fixture, role handoffs, repair rules, and delivery procedure. Extend its pilot walkthrough with the observed example.
- The pilot repo owns `cli.mjs`, its verification recipe, GitHub checks, candidate branch, and PR. Keep raw handoffs in the builder’s mission directory outside the pack.

## Data / contracts

Tie each approval to a plan revision and each verdict and check to a full commit SHA. Preserve initial and revised evidence separately. Record blocked reviews with their missing input and resume according to the existing loop. If a PR head changes, obtain fresh verification and independent review for the new head. Skipped, missing, and failed checks must retain their observed states. Keep credentials in the runtime store and omit private machine details from published examples.

## Testing

Run the pilot’s help and output commands at baseline and on both candidates. The target check must exercise the documented help syntax, destination description, and existing output behavior on the repaired candidate. Compare PR head, verdict SHA, and CI run evidence at delivery. For pack documentation, check paths, commands, and links and run `bash .github/scripts/engineering-verify` from the pack root. The planning baseline passed this command. Live OpenHands, review, and GitHub evidence must come from the implementation run.

## Notes for the AI

The user confirmed the test scenario. The pilot plan returned by OpenHands still needs the user’s approval in step 2. Make the deliberate omission explicit in the retrospective. If builder access, GitHub access, or CI setup prevents a live stage, record the exact blocker and last completed handoff. Keep the pilot PR open for the human merge decision.

## Pilot evidence

- Private target baseline [793871d](https://github.com/yairabf/engineering-workflows-pilot/commit/793871dc79857acbf56016f8cc4e55ccde3b6f66). On the Windows builder, help printed only `Usage: node cli.mjs [--help]` and `--output reports` resolved the target checkout’s reports path. Locally, `node --test cli.test.mjs` passed the output behavior and failed the help criterion. The PR workflow runs this same command.
- Pack pin `995d8e6f0ff316a166a4e67b59f78ed674ebd07e`. Pi in the OpenHands reader passed the pack readiness checks with explicit project skill registration, including all five roles. The writer recorded Pi readiness.
- Approved plan revision 1. First reviewer requested changes on `49447b3a0b57814d7389fc408d698165a5e399b7`. Fresh review passed `78c66850930e98a28be9028e8c0c5d9a1eb5f486`. At delivery, the [pilot PR](https://github.com/yairabf/engineering-workflows-pilot/pull/1) and [successful project check](https://github.com/yairabf/engineering-workflows-pilot/actions/runs/45242063852/job/137929009639) matched that head. The pilot PR was subsequently merged. Advisory OpenCodeReview was unavailable at delivery.

The user subsequently approved exercising the delivery procedure on a real issue. The delivery guide now covers recovery from an unavailable advisory reviewer, coverage checks across batches, and an explicit human decision bound to the reviewed head before merge. The real mission’s evidence stays in its target repository.


<!-- blueprint:completion {"schemaVersion":2,"specBytes":7654,"specSha256":"4656e0942d523e23307c9a0ad8aeafbd714bba67aed5cc8dfc6cf81195b4244c","branch":"refs/heads/feature/end-to-end-workflow-example","head":"b0628d3fea7ee8596b245b628069288c8d5ef4dc","baseRef":"refs/heads/main","baseCommit":"6a0d15dadcd9bd9c3a9da326f940aea49ae33ff2","sourceTree":"085afdd97ec86bb0ba60a5892a0604121740d27b","landing":"local-merge","absentOptional":[]} -->

## Independent review

# Independent Review

**Status:** passed
**Target commit:** b0628d3fea7ee8596b245b628069288c8d5ef4dc
**Base commit:** 6a0d15dadcd9bd9c3a9da326f940aea49ae33ff2
**Base ref:** main
**Spec hash:** 4656e0942d523e23307c9a0ad8aeafbd714bba67aed5cc8dfc6cf81195b4244c
**Prepared by:** codex
**Builder model:** unknown (runtime did not expose exact model)
**Requested reviewer:** codex
**Requested model:** gpt-6.2-astra
**Requested execution:** automatic
**Requested at:** 2026-11-24T13:15:49Z
**Workflow:** regular
**Check required:** no
**Reviewer adapter:** codex
**Reviewer model:** gpt-6.2-astra
**Reviewer context:** fresh subagent
**Actual execution:** automatic
**Reviewed at:** 2026-11-24T13:17:14Z
**Scope:** current
**Lenses:** quality, security, performance, tests
**Verdict:** passed
**Check result:** not-required

## Commands

- `EW_VERIFY_BASE=6a0d15dadcd9bd9c3a9da326f940aea49ae33ff2 bash .github/scripts/engineering-verify` passed.
- `git diff --check main...HEAD` passed. Git status, HEAD, merge base, tracked spec and SHA-256 matched the request.
- Local GitHub CLI help confirmed the run event filter and merge head precondition. Heading lookups confirmed both new local links.

## Evidence

- Reviewed the full committed delta in the verified spec, pack README and development workflow. The pilot table identifies the deliberate omission, failing and repaired revisions, independent verdicts and target CI job.
- Checked the delivery instructions against the packaged advisory workflow conditions and the exact-head approval requirement. The change introduces no executable code or tests.

## Findings

- None.

## Remaining risk

- The pilot repository is private. This local review inspected the recorded evidence and references without independently querying the historical CI job or the builder.
- This repository declares no dev, build, lint, test or browser command. No dedicated security or performance check is configured.

## Try it now

With access to the private pilot repository, run `gh run view 45242063852 -R yairabf/engineering-workflows-pilot --json headSha,conclusion`. Expect `success` for `78c66850930e98a28be9028e8c0c5d9a1eb5f486`, the repaired candidate.

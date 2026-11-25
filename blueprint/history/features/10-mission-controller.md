# Feature: Mission controller

**From build-plan:** feature 10
**Build attempt:** 1
**Branch:** feature/mission-controller
**Status:** verified

## Goal

Track one mission at a time from GitHub ticket submission through delivery. Give the operator the next role and its inputs, validate the submitted handoff, and recover the same next action after a restart. Keep plan approval and merge decisions with the operator.

## In scope

- Provide a local command-line entry point for mission submission, status, handoff submission, and operator decisions. Show the repository and ticket, current stage, relevant saved handoffs, and next action or blocker.
- Track repository preparation, investigation, planning, approval, implementation, independent review, repair, and GitHub delivery using the current workflow and its Markdown handoffs. The operator runs each role and returns its output to the controller.
- Persist handoff references, plan approval, candidate and review history, remaining repair rounds, and delivery evidence outside the pack and target checkout.

## Out of scope

- Automated role execution, session creation, and enforcement of workspace access by an execution adapter (feature 11).
- MCP, bot and intake integrations, package release changes, hosted infrastructure, and multiple concurrent active missions.
- Opening or merging PRs, triggering CI, or polling GitHub from the controller. The operator follows the existing delivery workflow and submits the results.

## Build loop

- Work on the recorded feature branch after spec approval. Run the relevant checks after each step and present the complete feature for review.
- Checkpoint commits are disabled. `/complete` creates the final feature commit.

## Build steps

- [x] **1. Add mission submission, status, and recovery.** Use a local Node command and an operator-selected storage directory. Save an identified GitHub repository and ticket with the mission before any handoff can start. Surface the existing preparation and readiness requirement as the first action when applicable. Make saved transitions recoverable by a fresh process. **Done when** a local fixture can submit a ticket, restart and recover the same next action, and reject a second active mission or invalid transition without losing the first. Missing or invalid saved state has an actionable diagnostic. Run the declared Verify command.
- [x] **2. Route investigation, planning, approval, and implementation.** Provide each role with the mission and required saved inputs. Accept a pending plan only for the current mission. Support planner clarification and a revised plan. Require the operator to explicitly approve the current saved revision before exposing the implementation handoff. On a material revision, require fresh approval. **Done when** scripted handoffs show the expected inputs for each role, clarification preserves the planning stage, approval survives restart, and implementation advances only for the approved revision with a valid candidate handoff. Run the declared Verify command.
- [x] **3. Route review and bounded repair.** Present the review inputs for the exact candidate SHA, then route `Pass`, `Changes requested`, and `Blocked` according to the existing review and repair loop. Preserve previous handoffs and verdicts. **Done when** scripted handoffs cover a mismatched SHA, a blocked review resumed in the same round, a passing original or revised candidate, and a pause after two unsuccessful repairs with both reviewed SHAs and outstanding findings visible. Repeat submission and restart checks around review decisions to verify the count. Run the declared Verify command.
- [x] **4. Record delivery and document the complete flow.** Present delivery inputs for the exact passing SHA. Accept the PR URL and CI evidence for that head, and expose pending or failing checks as operator actions. Document the command, state location, and recovery path. **Done when** the documented fixture runs from submission through delivery, stale-head evidence cannot complete the mission, and the recorded result can be read after restart. Run the declared Verify command.

- [x] **5. Repair independent review findings F-01 through F-04.** Recover an initial submit replay without an explicit revision, route a verified returning PR head through fresh review and delivery evidence, reject conflicting approved-plan references, and require a branch distinct from the recorded base. **Done when** the CLI regression cases pass and the declared Verify command passes.

- [x] **6. Repair independent review findings F-05 and F-06.** Allow a verified PR head observation to supersede a pending observation, even when the head returns to the passing commit. Validate that the implementation worktree is distinct from the readiness checkout. **Done when** both head-change sequences and equivalent readiness-path rejection pass through the CLI, the documented example delivers, and Verify passes.

- [x] **7. Repair independent review finding F-07.** Record a verified change to an existing PR head while a replacement candidate is under review or blocked. Preserve the review history and require fresh review and delivery evidence for the latest head. **Done when** the CLI exercises head changes during both review and blocked review, rejects stale verdicts, and Verify passes.

- [x] **8. Repair independent review finding F-08.** Expose the saved plan draft alongside its feedback and investigation brief when returning to planning. **Done when** a fresh status process after plan-feedback shows all three inputs and Verify passes.

- [x] **9. Repair independent review finding F-09 and repeated planning responses.** Allow a reviewer to record another identical blocked verdict after a new evidence submission and let a planner return the same draft after feedback without losing the approval gate. **Done when** the CLI covers both repeated responses, retains history and counts, and passes Verify.

## Files / areas

- `engineering-workflows/` for the local controller command and its state transitions.
- `engineering-workflows/README.md` for operator commands and an example using local handoff fixtures.
- `engineering-workflows/workflows/development.md` and the `workflow-investigate`, `workflow-plan`, `workflow-implement`, and `workflow-review` role skills and references for handoff rules.
- `engineering-workflows/builder-plan.mjs` and `engineering-workflows/builder/stage.mjs` for existing repository and ticket identity, readiness behavior, and saved plan conventions.
- `.github/scripts/engineering-verify` for the existing syntax and whitespace gate.

## Data / contracts

- Identify the mission by its GitHub repository and issue number. Retain the goal, acceptance criteria when supplied, optional source reference, and the target context required by the existing roles. Recover a mission within its saved repository and ticket even when the operator runs the command from a different checkout.
- Use a UTF-8 JSON state record in the local storage directory. Store the current stage, handoff and evidence references, approved plan revision, full candidate SHAs, review outcomes, repair history, and any PR and CI results. Save handoffs as Markdown and preserve the specific revisions used for approval and review. Keep credentials in the existing runtime credential stores.
- Keep the saved transition consistent with its referenced handoff. Reject submissions that do not match the current mission, stage, plan revision, or candidate SHA as applicable. If an operation is interrupted before it commits, recover the previous complete transition and allow it to be retried. Replaying an accepted submission must preserve the stage and counters. Concurrent invocations must preserve the one-active-mission limit and prevent lost updates.
- Record approval from an explicit operator action tied to the saved plan revision. Plan content is handoff data. The approved Markdown given to the developer must reflect the recorded decision. Preserve prior approved revisions for traceability when a plan is changed.
- Implementation supplies the approved-plan reference, dedicated branch and worktree, full candidate Git SHA, and observed test commands and results. The fresh reviewer gets the original mission, exact approved revision, repository and base, candidate commit, and factual test evidence. The operator follows the existing read-only access rules for investigation and review. Keep developer chat and self-assessment out of the review handoff.
- The initial `Changes requested` starts repair round 1 with zero unsuccessful repairs recorded. A `Changes requested` verdict on a revised SHA counts once for its round. `Blocked` preserves the missing input and pauses the current round without incrementing the count. A revised SHA needs a fresh review. After the second unsuccessful repair, show the outstanding findings, both repair SHAs, and their handoffs and verdicts, then wait for a human decision before another repair.
- For delivery, associate the PR URL and CI results with the passing reviewed SHA and the approved plan and test evidence. If the PR head changes, require the current head to go through review before accepting delivery for it. Use the existing delivery workflow for required CI, advisory findings, and human approval to merge.

## Testing

- Baseline `bash .github/scripts/engineering-verify` passed during spec preparation. It checks whitespace and JavaScript syntax.
- Run local CLI checks with saved Markdown fixtures and a disposable state directory. Exercise separate processes for restart recovery and competing submissions, including an interruption between handoff staging and state update. Use the scripted role inputs to verify approval, exact-SHA review, retry counting, and delivery gates.
- Verify from the documented operator entry point. Fixture checks cover controller behavior. The execution adapter and live GitHub interactions are covered by their respective workflows.

## Notes for the AI

- Reuse the existing workflow contracts and Node standard library. Keep the controller callable independently of the existing builder command so manual handoffs can exercise the complete route.
- Keep role and ticket text as data, and keep credentials out of state and diagnostics. Follow the existing target repository setup, role access, and delivery rules in the next-action instructions.


<!-- blueprint:completion {"schemaVersion":2,"specBytes":10415,"specSha256":"58b42d63944f2efa88262bf3235d30b24ecaf9a6e8d7ffa25ef301ed670f0ddc","branch":"refs/heads/feature/mission-controller","head":"d231a52929a8410916a6a7fe7ce1784a5341f74c","baseRef":"refs/heads/main","baseCommit":"ae6b9325c349bcd49855b547636ded8e5e0b900a","sourceTree":"a9dc2a15c53ea9c11ed010264f72be2ddc4ded10","landing":"local-merge","absentOptional":[]} -->

## Findings

### 10/F-01 [P1] closed - Retrying initial submission reports an error

**File:** engineering-workflows/mission-controller.mjs:39
**Found:** 2026-11-25 by /audit (scope: current; lenses: quality, security, performance, tests)
**Why it matters:** The documented initial submit omits --at. After it succeeds, the identical invocation fails the mandatory-revision check before comparing the accepted request. A lost first response cannot be recovered by retry as documented.
**Suggested fix:** Treat an omitted submit revision as zero for the existing request comparison. Keep the normal freshness check for any different request.
**Resolution:** Independent re-review confirmed the repair against the passing CLI regression.  The CLI checks an omitted submit revision as zero, and the retry test verifies that the first accepted response can be recovered without advancing state.

### 10/F-02 [P1] closed - A PR returning to an earlier candidate cannot enter fresh review

**File:** engineering-workflows/mission/transitions.mjs:178
**Found:** 2026-11-25 by /audit (scope: current; lenses: quality, security, performance, tests)
**Why it matters:** If the actual PR head changes from B back to A, recording the new head is rejected because A is in history. Submitting A directly also fails the global duplicate SHA check. Status continues to advertise B and there is no way to review and deliver the actual head.
**Suggested fix:** Keep stale delivery results unable to complete a mission. Provide an explicit operator transition for the observed changed head, including earlier commits, and require a fresh review before delivery.
**Resolution:** Independent re-review confirmed the repair against the passing CLI regression.  An explicit head-changed transition records a verified returning head and requires a new review and subsequent delivery evidence. The CLI test checks that the previous review and delivery are not reused.

### 10/F-03 [P1] closed - Conflicting approved-plan identifiers pass validation

**File:** engineering-workflows/mission/transitions.mjs:98
**Found:** 2026-11-25 by /audit (scope: current; lenses: quality, security, performance, tests)
**Why it matters:** An Approved plan field naming a different revision followed by a parenthetical reference to the current revision advances to review. Both implementation and review rely on this inclusion test, so the recorded handoff can identify a different approved plan.
**Suggested fix:** Require the plan field to identify exactly one approved-plan artifact and match the current revision. Preserve additional ticket or mission references in compound fields.
**Resolution:** Independent re-review confirmed the repair against the passing CLI regression.  Implementation and review require exactly one approved-plan identifier in their relevant field. Both conflicting-reference CLI cases reject the handoff.

### 10/F-04 [P1] closed - Candidate on the recorded base branch is accepted

**File:** engineering-workflows/mission/transitions.mjs:108
**Found:** 2026-11-25 by /audit (scope: current; lenses: quality, security, performance, tests)
**Why it matters:** A candidate explicitly naming main when the saved base is main advances to review. This contradicts the dedicated branch requirement and then binds any repairs to that branch.
**Suggested fix:** Reject a candidate whose branch identifies the recorded base, including equivalent local ref notation. Exercise this case through the CLI.
**Resolution:** Independent re-review confirmed the repair against the passing CLI regression.  The candidate rejects a branch equal to the recorded base after normalizing refs/heads notation. The CLI test covers both main and refs/heads/main.

### 10/F-05 [P1] closed - A second PR head change can strand delivery

**File:** engineering-workflows/mission/transitions.mjs:171
**Found:** 2026-11-25 by /audit (scope: current; lenses: quality, security, performance, tests)
**Why it matters:** Once delivery records a change from A to B, a further verified change to C cannot be recorded before B's handoff arrives. The head-changed command rejects this stage and candidate only accepts B. If B was superseded before a handoff could be produced, the operator cannot submit the actual head for fresh review.
**Suggested fix:** Allow the operator to update the observed head for the same PR while waiting for a candidate. Retain previous observations and require a handoff, review and delivery evidence for the latest head. Exercise A to B to C and A to B to A before any B handoff.
**Resolution:** The explicit head-changed action records superseding observations during delivery-head-changed. Tests cover A to B to A and A to B to C before submitting the latest candidate. Independent re-review ran both sequences successfully.

### 10/F-06 [P1] closed - The readiness checkout is accepted as the dedicated implementation worktree

**File:** engineering-workflows/mission/transitions.mjs:118
**Found:** 2026-11-25 by /audit (scope: current; lenses: quality, security, performance, tests)
**Why it matters:** The documented example and passing CLI suite both submit the readiness checkout itself as the implementation worktree. An absolute path passes even when it identifies exactly the checkout that the development workflow directs the developer to leave for a separate worktree.
**Suggested fix:** Reject a worktree identifying the saved readiness checkout, including equivalent path spellings. Show a separate fixture worktree in the example and tests and cover rejection of the readiness checkout. The operator can continue verifying Git facts locally.
**Resolution:** The controller persists the canonical checkout and rejects an equivalent implementation worktree path. Tests cover the original path, dot suffix, and symlink alias, and the example uses a separate worktree. Independent re-review confirmed the CLI rejects all three equivalent paths.

### 10/F-07 [P1] closed - Returning PR head cannot replace a candidate under review

**File:** engineering-workflows/mission/transitions.mjs:175
**Found:** 2026-11-25 by /audit (scope: current; lenses: quality, security, performance, tests)
**Why it matters:** The PR can return to passing A after B's implementation handoff has been submitted. If B's review is blocked, recording the verified change to A fails the stage guard and submitting A as a candidate fails the historical SHA guard at line 108. The operator cannot initiate fresh review of the actual head using either documented action. An independent CLI fixture reproduced both errors.
**Suggested fix:** Support an explicit verified head change for the existing PR while its replacement candidate is under review or blocked. Retain its history and require a fresh handoff, verdict, and delivery evidence for the returning head. Exercise the transition after candidate submission.
**Resolution:** The explicit head-changed transition is available for an existing PR during active and blocked review and repair. The CLI regression supersedes a candidate both before and after a blocked verdict, rejects the stale review, and demands fresh delivery evidence. Independent re-review ran the active and blocked replacement cases and confirmed that superseded verdicts cannot advance delivery.

### 10/F-08 [P1] closed - Planner feedback omits the draft to revise

**File:** engineering-workflows/mission/status.mjs:60
**Found:** 2026-11-25 by /audit (scope: current; lens: quality, tests)
**Why it matters:** After the operator records plan-feedback, planning status supplies the feedback and brief but omits the saved plan whose changes are requested. A fresh planner cannot identify the exact draft from the handoff when feedback refers to one of its sections. A fresh CLI process reproduced the omission at revision 5 of the documented fixture.
**Suggested fix:** Show the latest draft when planning resumes from feedback and exercise that handoff after restart.
**Resolution:** Planning status now prints the latest saved plan draft alongside the investigation brief and feedback. The CLI test confirms the three inputs after a new status process. Independent re-review confirmed that the restart regression checks the exact draft, feedback, and investigation brief.

### 10/F-09 [P1] closed - A resumed reviewer cannot repeat an unchanged blocked verdict

**File:** engineering-workflows/mission/transitions.mjs:161
**Found:** 2026-11-25 by /audit (scope: current; lenses: quality, tests)
**Why it matters:** When supplemental evidence fails to supply a missing input, the reviewer can legitimately return the identical Blocked report for the same candidate. The controller rejects that report because its artifact already occurs in candidate history. The mission stays in review, where the operator cannot record further evidence. A direct transition fixture reproduced this sequence with a screenshot supplied in place of the requested test output.
**Suggested fix:** Allow a new blocked event at the current revision after supplemental evidence. Reuse the content-addressed artifact and retain the existing original-revision replay protection. Exercise two identical blocked verdicts separated by evidence, then resume to a completed verdict.
**Resolution:** A resumed review may record another identical Blocked artifact at a new revision. The regression feeds partial and complete evidence, observes both blocked events, and completes the same round with the correct repair count. Independent re-review confirmed two identical blocked verdicts survived restart with zero unsuccessful repairs, followed by a completed verdict in the same round.

## Independent review

**Status:** passed
**Target commit:** d231a52929a8410916a6a7fe7ce1784a5341f74c
**Base commit:** ae6b9325c349bcd49855b547636ded8e5e0b900a
**Base ref:** main
**Spec hash:** 58b42d63944f2efa88262bf3235d30b24ecaf9a6e8d7ffa25ef301ed670f0ddc
**Prepared by:** codex
**Builder model:** unknown (runtime did not expose exact model)
**Requested reviewer:** codex
**Requested model:** gpt-6.2-astra
**Requested execution:** automatic
**Requested at:** 2026-11-25T06:14:52Z
**Workflow:** regular
**Check required:** no
**Reviewer adapter:** codex
**Reviewer model:** gpt-6.2-astra
**Reviewer context:** fresh subagent
**Actual execution:** automatic
**Reviewed at:** 2026-11-25T06:16:27Z
**Scope:** current
**Lenses:** quality, security, performance, tests
**Verdict:** passed
**Check result:** not-required

## Commands

- `EW_VERIFY_BASE=main bash .github/scripts/engineering-verify` passed.
- `node --test engineering-workflows/mission/mission-controller.test.mjs` passed all three CLI scenarios with zero skipped.
- Ran the disposable Bash example in the mission README. The controller reached delivery at revision 8 with the passing head, CI and advisory evidence.

## Evidence

- Verified the target, merge base, tracked spec digest and working tree. Reviewed the controller entry point, store, transitions, status, CLI tests, both READMEs and spec across the full range.
- Checked atomic revision publication, artifact verification, identity and approval gates, repair counting, and revised PR head handling against the local operator workflow.
- Fresh CLI processes recovered planning feedback, accepted the same draft for explicit approval, and retained both identical blocked verdicts after supplemental evidence.

## Findings

- Closed F-09. F-01 through F-08 remain closed. No new findings.

## Remaining risk

- Local fixture evidence covers the controller. GitHub head observations, CI outcomes and the merge decision are operator-supplied.

## Try it now

Run the disposable local example in the [operator guide](../../../engineering-workflows/mission/README.md). It should finish with the mission in `delivered` state at revision 8.

The example demonstrates the complete controller workflow using fixture evidence.

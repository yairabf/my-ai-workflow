# Feature: OpenHands execution adapter

**From build-plan:** feature 11
**Build attempt:** 1
**Branch:** feature/openhands-execution-adapter
**Status:** verified

## Goal

On the existing private Windows Docker builder, run a GitHub implementation ticket from preparation to a reviewed pull request using fresh Pi role sessions. The operator starts the mission, answers material questions, approves the plan, resolves blockers, and decides whether to merge.

## In scope

- Drive eligible stages automatically for one mission at a time. Use the mission controller's saved stage, revision, approvals, retry history, and handoffs as the authority.
- Support established repositories and new projects without application code. Allow investigation experiments in an isolated disposable copy.
- Capture each stage's result, including questions, failures, and evidence. Return a status the operator can act on.

## Out of scope

Design-only tickets, a mandatory architecture phase, other agent runtimes, MCP, bots, and new ticket intake channels. Keep the existing standalone ticket-planning command usable.

## Build loop

Review the feature as a whole. Exercise each step through its entry point. Checkpoint commits are disabled. Run final verification and review before the feature commit in /complete.

## Build steps

- [x] Connect a documented run/resume entry point to the existing builder preparation and controller. Select the mission by repository and issue, use its saved revision, reuse verified setup, and stop at existing human decision states. Done when a disposable ticket reaches investigation with a recorded readiness handoff, a repeated invocation reuses preparation, and an unavailable builder reports the failed operation.
- [x] Launch Investigator with the mission and an isolated writable copy of the starting tree. Allow dependency installation, tests, new POCs, and temporary source edits inside the copy. Update the role instructions for this mode and retain read-only behavior when the caller provides read-only access. Save the brief and reproducible observations outside the copy, then discard it. Done when a real experiment changes a file in the copy, the brief identifies the starting revision when present, command and result, and the original checkout and implementation starting point are unchanged.
- [x] Support a question as an investigation result. Check available evidence first. Ask only when the answer materially affects implementation, such as a required cloud environment, a latency target, or expected peak load. Save findings, question, and why it matters. Expose the waiting state and an operator answer through the controller. Resume in a fresh investigator session with that history. Done when a ticket without application code or deployment guidance pauses, restarts with the question intact, accepts the answer for the correct mission revision, and produces a completed brief before planning.
- [x] Run Planner read-only with the mission, completed brief, and relevant answers. Save a pending plan and use the controller's feedback and approval flow. Launch Developer only for the exact approved plan, in its dedicated writable worktree. Capture branch, worktree, candidate SHA, commands and observed results. Done when pending approval prevents coding, revised plans require their own approval, and the approved run yields a verifiable candidate based on the original project state.
- [x] Launch a fresh read-only reviewer for the exact candidate and base, with the original mission, approved plan, committed changes and factual test evidence. Give repairs the relevant findings and the same implementation worktree. Route revised commits to fresh review. Done when a changes-requested verdict leads to repair and independent re-review, a blocked verdict exposes the missing evidence, and two unsuccessful repairs pause for the operator under existing controller rules.
- [x] Drive the existing GitHub delivery workflow after a passing review. Record the same-repository PR URL, actual head, target CI and advisory review outcome. Recheck the PR head before presenting the merge decision. Done when the pilot returns the reviewed PR and observed check results, a changed head routes back to review, and the operator retains the merge decision.

- [x] Repair independent-review findings F-01 through F-06. Done when targeted regressions prove live PR evidence controls delivery, review uses committed files, investigation and repair handoffs meet their contracts, and refresh and launch failure paths handle workspace resources correctly.

- [x] Repair F-07 through F-09. Done when incomplete plans are rejected, a failed handoff can be corrected against its existing commit and revision, and an advisory disposition naming a different issue is rejected.

- [x] Repair F-10 through F-13. Done when regressions cover skipped pack checks alongside project CI, repeated head changes, updated repair evidence in the PR description, and diagnostic and scratch cleanup on packet failure.

- [x] Repair F-14 and F-15. Done when a planner question survives restart and the linked answer reaches a fresh planner, and Windows-format operator files are normalized through the builder CLI.

- [x] Repair F-16 and F-17. Done when an unchanged implementation or repair can retry on its clean starting commit, and delivery records the fresh review of a moved PR head even when its CI evidence is identical.

- [x] Repair F-18 and F-19. Done when a skipped conditional job permits a passing target check, and same-head CI refresh preserves the operator’s advisory evidence.

- [x] Repair F-20. Done when resuming a previously unborn repository records its initialized base, preserves operator answers and requires a new investigation, plan and approval.

- [x] Repair F-21. Done when verbose commands with identical logs and different exit codes retain their status and indicate truncation in the workspace tool response.

## Files / areas

- Builder planning and execution: engineering-workflows/builder-plan.mjs, builder-project.mjs, and builder/ under engineering-workflows/.
- Mission CLI and state: engineering-workflows/mission-controller.mjs and engineering-workflows/mission/ (transitions, status, store, documentation, and existing regression tests).
- Pack role definitions and adapters under engineering-workflows/.agents/skills/ and engineering-workflows/.claude/skills/. Update operator commands and handoff guidance in engineering-workflows/README.md and engineering-workflows/workflows/development.md. Align blueprint/context/project-overview.md with the confirmed investigation access model.

## Data / contracts

- Reuse controller ticket identity, UTF-8 Markdown handoffs, exact saved filenames, revision checks and stage validation. Bind each role result to its launching ticket, revision and inputs. Keep operator answers distinct from role output. Retain compatibility with saved missions.
- Give each session only its required workspace access and handoff files. Enforce access at the builder boundary. The investigator's writable copy must have no writable link to the source or shared Git metadata. Keep the planner and reviewer read-only. Limit developer and repair writes to the implementation worktree and the Git operations needed there.
- Keep real mission artifacts outside the pack and target checkout. Capture the role result separately from diagnostics. Exclude credentials and developer chat from review materials. Keep credentials in the appropriate runtime store.
- Reject empty, malformed, stale, or wrong-ticket output before advancing. Report the stage and actionable reason on launch, access, or execution failure. After interruption or concurrent invocation, reconcile the saved revision, existing candidate/worktree and PR before repeating side effects. Pause for the operator if the outcome cannot be established.

## Testing

Run bash .github/scripts/engineering-verify. Exercise controller transitions and restart/stale-result cases with the existing node --test engineering-workflows/mission/mission-controller.test.mjs harness. Exercise the documented adapter command with disposable tickets, including an empty project, a temporary source edit, clarification across restart, denied workspace access, and a failed or interrupted session. Verify read-only and writable boundaries from inside the actual role sessions. Check previously supported ticket planning separately. Use the Windows builder and a pilot PR for integration evidence, recording the actual revision, handoffs, CI and any unavailable check.

## Notes for the AI

Reuse the builder's existing repository preparation, Pi launch and output capture, and the controller's transitions. Keep workflow decisions in the controller. Inspect the current builder mounts before choosing how to expose the disposable copy and worktree. A project without application code is a valid investigation input. Acceptance concerns the ticket's implementation goal, so avoid a fixed greenfield questionnaire.

The repository Verify command passed during planning. See the implementation evidence below for live builder checks.

## Implementation evidence

- Windows OpenHands Docker, fresh Pi sessions: a write probe changed existing config.txt in the disposable copy. An independent read of the original still returned its original contents. A write attempt through the read-only bind returned EROFS.
- Disposable greenfield mission: investigation paused at revision 3, accepted the operator fixture's Azure answer at revision 4, recorded a brief at revision 5 and stopped at the pending plan at revision 6. The original checkout remained clean. After a test approval, the developer produced commit 271400a10c6291df81cf4e5707126ee3038af2f6 and a separate reviewer passed that SHA. The builder transferred its Git bundle.
- Delivery regression: a disposable local Git remote and simulated GitHub CLI verified publishing the reviewed SHA, reusing the same PR and detecting a changed head.
- Windows preparation smoke test: in an isolated copy of the previously prepared Chalk pilot checkout, the actual GitHub issue lookup and Pi catalog check succeeded, setup was skipped, and resume returned the same investigation revision. The standalone planner lookup still returned the existing pending plan.
- Repair fixture: a developer fixed a deliberately incorrect candidate on its dedicated branch. A fresh reviewer inspected revised commit 62c227288ef75b4ba1a614e2b62af87bf8fc5f31 and exercised the blocked-review path. After the factual repair handoff was supplied, a fresh reviewer passed the same SHA at revision 11. The controller regression suite covers the two-unsuccessful-repair pause.
- Private Windows pilot: issue 4 reached a pending plan and explicit approval, then candidate b3e4d6e10d4af9e328a867c84c4cbd1065bb8753 passed both target tests and independent pre-publication review. [PR 5](https://github.com/yairabf/engineering-workflows-pilot/pull/5) opened against main with only pilot-check.md. [Pilot CI](https://github.com/yairabf/engineering-workflows-pilot/actions/runs/45656830652) passed on that head. The advisory job completed with no items selected. Merge is a human decision.


<!-- blueprint:completion {"schemaVersion":2,"specBytes":11221,"specSha256":"f974d584f97d00b24eab6be3d364c233d371b53dc490ae37d6a58231b44da6b7","branch":"refs/heads/feature/openhands-execution-adapter","head":"fa4d335eb5d77fd6110b66beffa3ad9a852f2dcc","baseRef":"refs/heads/main","baseCommit":"52b525e215e55ba6ab3c36c0c305f1b31ea627f3","sourceTree":"f0e3db3c548ff3b37b502a34b7403ece45880f08","landing":"local-merge","absentOptional":[]} -->

## Findings

### 11/F-01 [P1] closed - Operator delivery can present a stale head for merge

**File:** engineering-workflows/builder/stage.mjs:313
**Found:** 2026-11-25 by /audit (scope: current; lens: quality)
**Why it matters:** The documented operator delivery action records the supplied SHA and CI result directly. If the PR changes while the operator handles advisory findings, the old report still advances the mission to delivered. An in-memory transition confirmed this path takes no remote observation.
**Suggested fix:** Refresh the existing PR head and checks on this action. Bind the advisory disposition to that observed head and route a moved head to review.
**Resolution:** Operator disposition now refreshes the known GitHub PR, derives CI from live checks and only applies advisory evidence to the matching head. Regression covers changed head and failed CI. Independent re-review confirmed the repair. The delivery regression observed a changed remote head and a failing CI check during disposition.

### 11/F-02 [P1] closed - Review can test files outside the candidate commit

**File:** engineering-workflows/builder/drive.mjs:75
**Found:** 2026-11-25 by /audit (scope: current; lens: quality)
**Why it matters:** Review reuses the implementation directory and checks only HEAD. A tracked edit between recording the candidate and resuming review survives this check. A reviewer running tests reads the edited files while signing off the earlier SHA. Ignored build products can also survive a clean status.
**Suggested fix:** Mount a clean checkout of the exact candidate for each review. Keep the implementation directory for repairs. Exercise the resume path with a changed implementation file.
**Resolution:** Each review mounts a fresh checkout materialized from the candidate Git objects. Regression verifies tracked edits and ignored files in the implementation directory are excluded. Independent re-review confirmed the repair. The real Git fixture produced a clean detached checkout containing the committed file and excluding ignored output.

### 11/F-03 [P1] closed - Incomplete investigation handoffs advance to planning

**File:** engineering-workflows/builder/drive.mjs:130
**Found:** 2026-11-25 by /audit (scope: current; lens: quality)
**Why it matters:** The new run path passes a brief directly to the controller. A local probe with only Mission, Repository context, and Verified findings headings, each containing a placeholder, advanced to planning. It supplied no observed finding, evidence, or inspected revision. The standalone planning path already validates the populated template and evidence entries.
**Suggested fix:** Reuse the existing investigation handoff validator in the automated path before recording the brief, including an explicit check for the known starting revision. Keep the separate question path.
**Resolution:** The adapter shares the standalone brief validator and requires the known starting revision. Regression rejects missing evidence and a missing starting SHA. Independent re-review confirmed the repair. The brief regression rejected both missing finding evidence and a missing starting revision.

### 11/F-04 [P1] closed - Repair sessions omit the operator’s continuation instructions

**File:** engineering-workflows/builder/mission-role.mjs:26
**Found:** 2026-11-25 by /audit (scope: current; lens: quality)
**Why it matters:** After two unsuccessful repairs the documented continue action asks the operator for the outstanding issues and how to proceed. The controller retains this artifact, but the fresh repair session receives only the mission, approved plan, prior candidate and review. It cannot act on the operator’s decision about how to repair the candidate.
**Suggested fix:** Include the applicable saved continue artifact in the resumed repair input. Cover a continuation with instructions absent from the prior review.
**Resolution:** The repair prompt includes the latest saved continuation decision. Regression checks that the fresh session receives an operator-only instruction. Independent re-review confirmed the repair. The repair input regression recovered the instruction supplied only in the operator continuation.

### 11/F-05 [P2] closed - PR status refresh retransfers the entire repository history

**File:** engineering-workflows/builder/drive.mjs:119
**Found:** 2026-11-25 by /audit (scope: current; lens: performance)
**Why it matters:** Each run while waiting for CI or advisory disposition creates a fresh git bundle of HEAD and its reachable history and sends it through the operator machine. The ordinary refresh path in publishCandidate only reads GitHub status and never opens the bundle.
**Suggested fix:** Request the bundle only when publication or a reviewed repair actually requires it. Existing delivery and status logic can serve unchanged-head refreshes. No current requirement would be lost.
**Resolution:** Unchanged-head refresh skips the role container and bundle. A regression covers the no-transfer path and a live refresh confirmed delivered revision 13. Independent re-review confirmed the repair. The refresh regression reached delivery without starting a workspace or transferring a bundle.

### 11/F-06 [P2] closed - Launch failures skip saved stage diagnostics and scratch cleanup

**File:** engineering-workflows/builder/drive.mjs:113
**Found:** 2026-11-25 by /audit (scope: current; lens: quality)
**Why it matters:** The packet operation allocates the investigation or planning scratch clone before Docker starts the workspace. Docker launch runs outside the try block, so a mount or image failure skips the recorded failure and leaves the scratch checkout behind. A repeated run allocates another clone.
**Suggested fix:** Enclose container launch in the stage failure and cleanup scope. Remove the scratch directory on launch failure and remove the container only after creation succeeds.
**Resolution:** Container startup is now inside the failure and cleanup boundary. Regression confirms a failed launch saves the stage error and removes its scratch workspace. Independent re-review confirmed the repair. The launch-failure regression recorded the failure at its revision and removed the scratch directory.

### 11/F-07 [P1] closed - Unfilled plan template advances to approval

**File:** engineering-workflows/builder/drive.mjs:98
**Found:** 2026-11-25 by /audit (scope: current; lens: quality)
**Why it matters:** The run path validates the investigation template only. A local probe submitted the shipped planner template with the exact ticket and saved brief references. The controller advanced to approval with placeholder changes, acceptance criteria and verification.
**Suggested fix:** Validate planner sections and placeholders before recording the plan. Preserve the controller’s exact saved-brief filename contract when reusing the standalone validator. Cover unfilled and complete plans.
**Resolution:** The adapter validates the filled plan template and the exact saved brief reference before recording it. Placeholder, wrong-brief and complete-plan regressions passed. Independent review confirmed the validator runs before recording the plan and reran all three cases.

### 11/F-08 [P1] closed - Rejected candidate handoffs replay on every resume

**File:** engineering-workflows/builder/drive.mjs:159
**Found:** 2026-11-25 by /audit (scope: current; lens: quality)
**Why it matters:** Capture saves a replay pointer for implementation and repair before either workspace validation or controller validation. A rejected handoff leaves the same revision and pointer active. Two successive drive calls with that saved malformed result both recorded failure without obtaining new evidence. The documented operator actions cannot replace this handoff at this stage.
**Suggested fix:** Keep interrupted valid results replayable. Provide a revision-bound way to reconcile a rejected handoff against the existing commit and submit corrected evidence without repeating implementation. Exercise two consecutive invocations.
**Resolution:** Added revision-bound recover-handoff for failed developer or repair stages. A two-run regression rejected malformed evidence and then advanced the existing commit to review using corrected evidence; stale correction was rejected. Independent review confirmed the revision check and reran the two-invocation regression.

### 11/F-09 [P1] closed - Advisory disposition accepts a different ticket with the same number prefix

**File:** engineering-workflows/builder/delivery.mjs:122
**Found:** 2026-11-25 by /audit (scope: current; lens: quality)
**Why it matters:** The validator matches the ticket URL as a substring. For issue 7, an operator document citing only issue 70 passes the ticket check when the PR and head match. Delivery then writes the expected issue 7 URL into the output, masking the wrong-ticket input from controller validation.
**Suggested fix:** Reuse the controller’s exact ticket citation check on the original disposition. Cover issue 7 versus issue 70 with matching PR and head.
**Resolution:** The original operator document now passes through the controller’s exact issue citation validator. Regression rejected issue 70 for issue 7 with matching PR and head. Independent review reran the original-document check and confirmed the mismatched ticket is rejected before delivery.

### 11/F-10 [P1] closed - Disabled pack Verify prevents delivery after project CI passes

**File:** engineering-workflows/builder/delivery.mjs:110
**Found:** 2026-11-25 by /audit (scope: current; lens: quality)
**Why it matters:** The installed workflow emits a skipped job named Verify (project CI or setup required) when the repository uses its own CI. The delivery aggregation requires every non-advisory entry to be SUCCESS. A local delivery fixture with a successful project check and this skipped job returned Pending. Every refresh of the completed checks produces the same outcome.
**Suggested fix:** Exclude the known disabled pack job from the CI decision. Retain its observation as evidence. Require actual project verification and test both a passing project check and the disabled job alone.
**Resolution:** CI aggregation excludes the specifically named skipped pack placeholder. Fixtures verify a passing real project check and a placeholder-only result. Independent review confirmed the repair. The delivery fixture passed both the project-success-plus-skipped and skipped-only cases.

### 11/F-11 [P1] closed - A second change to the PR head stalls automated recovery

**File:** engineering-workflows/builder/mission-role.mjs:82
**Found:** 2026-11-25 by /audit (scope: current; lens: quality)
**Why it matters:** If the branch changes again after the controller records the first change, recovery fetches the new SHA, compares it to the saved obsolete head and throws. Each run repeats this comparison and allocates another checkout. The builder delivery command only accepts delivery or delivered and exposes no head-changed action for this waiting stage. The controller already supports recording another observed head.
**Suggested fix:** Record the new head through the existing controller transition after verifying the fetch against the live PR, then resume fresh review. Dispose of abandoned temporary checkouts and exercise two successive changes.
**Resolution:** Recovery matches the fetched SHA with GitHub, records the additional head transition and submits that exact candidate for review. A local Git fixture verified the second move and saved revisions. Independent review confirmed the repair. The Git fixture recorded the second head and the matching candidate at revision 3.

### 11/F-12 [P2] closed - Published repair retains the PR description for the old commit

**File:** engineering-workflows/builder/delivery.mjs:61
**Found:** 2026-11-25 by /audit (scope: current; lens: quality)
**Why it matters:** Publishing a reviewed repair pushes the revised branch and reads the PR again. Only the initial creation path writes the SHA, verification evidence and review to its description. A human opening the updated PR therefore sees the previous commit's evidence as the delivery summary, contrary to the documented delivery contract.
**Suggested fix:** Refresh the adapter-owned delivery summary for the reviewed head, preserving operator edits. Verify both initial publication and subsequent publication of a repaired candidate.
**Resolution:** Delivery refreshes the published repair summary, preserving operator notes and handling a resumed publication. The local Git and simulated GitHub test verified the new SHA and evidence. Independent review confirmed the repair. The resumed publication fixture replaced the prior evidence and retained the operator note.

### 11/F-13 [P2] closed - Packet preparation failures lose stage diagnostics and scratch cleanup

**File:** engineering-workflows/builder/drive.mjs:131
**Found:** 2026-11-25 by /audit (scope: current; lens: quality)
**Why it matters:** The packet call runs before the failure handler. For example, a missing Thermo skill during review prompt construction throws after the scratch directory has been allocated. No saved failure appears in status and each retry leaves another scratch directory.
**Suggested fix:** Clean scratch storage within packet construction when it fails before returning ownership. Record the stage and revision on packet preparation failures through the existing failure path.
**Resolution:** Packet preparation now records errors at the current mission revision and cleans abandoned temporary workspaces. A missing-review-skill regression checked both the status diagnostic and remaining directories. Independent review confirmed the repair. The missing-skill fixture recorded the failed review revision and removed the session scratch directory.

### 11/F-14 [P1] closed - Builder cannot resume a planner clarification

**File:** engineering-workflows/builder/drive.mjs:107
**Found:** 2026-11-25 by /audit (scope: current; lens: quality)
**Why it matters:** The shipped Planner must ask when a missing decision changes scope or acceptance. Its question fails full-plan validation. The builder CLI rejects the controller's clarification action, leaving the operator unable to supply the answer through the documented builder interface. Repeating run launches the planner with the same inputs.
**Suggested fix:** Save the planner's question using the controller clarification contract, return control to the operator and expose a revision-bound answer through the builder. Verify restart and fresh planning with the saved answer before approval.
**Resolution:** The builder records material planner questions, pauses durably and accepts a revision-bound clarification linked to the saved question. A restart regression verified both inputs reach the next planner before its plan advances to approval. Independent review reran the controller restart regression and inspected the fresh role inputs.

### 11/F-15 [P1] closed - Builder rejects Windows line endings in advisory dispositions

**File:** engineering-workflows/builder-plan.mjs:115
**Found:** 2026-11-25 by /audit (scope: current; lens: quality)
**Why it matters:** A Windows CRLF Markdown disposition reaches the delivery parser unchanged. The real delivery function accepted the LF document and rejected its CRLF equivalent with “Expected one Markdown field named PR.” This blocks the merge decision for valid operator files and differs from the existing controller file input contract.
**Suggested fix:** Read builder operator files through the existing operatorFile helper to normalize CRLF before field and section validation. Exercise delivery and corrected candidate handoffs with CRLF.
**Resolution:** Builder operator files now use the existing UTF-8 reader and CRLF normalization. A builder CLI regression verified that Windows delivery, recovery and clarification inputs reach the writer with normalized Markdown. Independent review reran the builder CLI regression for all three commands.

### 11/F-16 [P1] closed - Unchanged implementation HEAD can become a candidate

**File:** engineering-workflows/builder/drive.mjs:114
**Found:** 2026-11-25 by /audit (scope: current; lens: quality, tests)
**Why it matters:** A clean implementation clone starts at the recorded base. Git accepts that commit as its own ancestor. A developer handoff citing that SHA passes the workspace check even if the developer never committed anything. The first candidate also passes the controller's uniqueness check. A passing review can then lead to publishing a branch with no commits ahead of the base and a PR creation failure.
**Suggested fix:** Require the initial candidate SHA to differ from the starting SHA. Report that no candidate commit was produced and allow implementation to resume on the clean starting tree. Exercise the unchanged candidate through the builder.
**Resolution:** The builder rejects a developer handoff at its starting commit and can retry the same revision in a fresh role session. The regression exercises both implementation and repair. Independent review reran the two-stage retry regression and confirmed the starting SHA is checked before recording either result.

### 11/F-17 [P1] closed - Delivery drops fresh review of a changed PR head when checks stay the same

**File:** engineering-workflows/builder/mission-role.mjs:278
**Found:** 2026-11-25 by /audit (scope: current; lens: quality, tests)
**Why it matters:** When the PR moves from A to B, the controller stores the live evidence with changed=true. After review passes B, an unchanged CI rollup produces identical Markdown but the result kind is now delivery. The duplicate-document shortcut suppresses that transition. Status keeps hiding the PR, CI and advisory disposition because changed remains true. Repeated run calls return the same incomplete status.
**Suggested fix:** Deduplicate only when the prior observation has the same transition meaning as the new result. Cover the round trip from a changed head to fresh passing review and unchanged CI, then verify that status displays the PR and next operator action.
**Resolution:** Delivery records the first observation following fresh review of a changed PR head. A controller integration test checks the PR, CI, next merge decision and subsequent idempotent refresh. Independent review reran the changed-head controller integration and verified that only an ordinary, unchanged delivery observation is deduplicated.

### 11/F-18 [P1] closed - A skipped conditional job keeps successful CI pending indefinitely

**File:** engineering-workflows/builder/delivery.mjs:131
**Found:** 2026-11-25 by /audit (scope: current; lens: quality, tests)
**Why it matters:** A same-head rollup with a successful unit job and a skipped docs-only job produces CI Pending even though both jobs have finished. Each refresh repeats the same verdict and prevents the controller from presenting the merge decision. The existing skip regression covers only the pack's disabled Verify job.
**Suggested fix:** Distinguish completed, non-applicable jobs from running work. Require positive target verification for a pass, preserve real failures and pending jobs, and cover a successful target job alongside an ordinary conditional skip.
**Resolution:** Rollup evaluation excludes skipped and neutral jobs, requires a positive target result, and preserves active checks and failures. The delivery fixture exercises each outcome with a conditional skip. Independent review reran the fixture and confirmed that one positive verification is required and an active or failing check retains its outcome.

### 11/F-19 [P2] closed - Refresh drops the operator's evidence for the advisory disposition

**File:** engineering-workflows/builder/delivery.mjs:162
**Found:** 2026-11-25 by /audit (scope: current; lens: quality)
**Why it matters:** Refresh after a same-head Resolved disposition retains the verdict but replaces its rationale with an instruction to review findings. The resulting document differs from the operator's record, so the controller saves a new revision and status points at this new evidence file. The prior rationale survives only in history.
**Suggested fix:** Keep the operator's evidence or a stable reference to it when refreshing that head. Exercise resolution followed by an ordinary refresh and a changed-CI refresh.
**Resolution:** The builder carries same-head operator evidence into each refresh. A regression checks an identical refresh, updated CI and a moved head. Older resolved artifacts are linked by filename. Independent review reran the fixture and confirmed that the submitted evidence survives a same-head CI update and is excluded from a moved-head observation.

### 11/F-20 [P1] closed - An approved mission cannot resume after initializing an empty repository

**File:** engineering-workflows/builder/mission-role.mjs:193
**Found:** 2026-11-25 by /audit (scope: current; lens: quality, tests)
**Why it matters:** A mission can complete investigation and approval with an unborn starting revision. Implementation tells the operator to initialize the base and review the plan again. The next run still reads the immutable unborn readiness artifact. A disposable local mission produced the identical failure before and after committing an empty initial base on its recorded checkout. The builder exposes no action to return this mission to preparation, and the controller disallows another submission while this one is active.
**Suggested fix:** Provide a revision-bound route to record the newly initialized base and repeat the affected investigation, planning and approval gates. Alternatively, require an initialized base before recording readiness, while preserving investigation and clarification for code-free projects. Cover the operator action and successful resume.
**Resolution:** Resume now binds the initialized branch commit to a new readiness revision and restarts investigation with the saved answers. A local Git and controller regression verified restart, old approval rejection and return to implementation after fresh approval. Independent review reran the initialized-base regression and confirmed that the prior plan is cleared, the answers survive, and implementation requires approval of a new plan.

### 11/F-21 [P1] closed - Verbose verification commands lose their exit status

**File:** engineering-workflows/builder/role-session.mjs:32
**Found:** 2026-11-25 by /audit (scope: current; lens: quality, tests)
**Why it matters:** The workspace tool prepends the exit status to the command log and then keeps its last 24,000 characters. A probe through roleSession returned identical evidence for exit 0 and exit 1 when stdout was 25,000 characters. A developer or reviewer receiving this output cannot determine from the tool response whether the check passed. Timeouts and buffer errors can lose their diagnostic status the same way.
**Suggested fix:** Truncate stdout and stderr before adding the completion status. Keep the status and a truncation indicator visible. Exercise the workspace tool with identical long logs and different exit codes.
**Resolution:** The tool truncates only the log and prepends the command status and a truncation notice. A role-session regression exercised identical 25,000-character logs with exit codes 0 and 1. The independent reviewer confirmed that the status is added after the log is bounded and reran the verbose-output regression for both exit values.

## Independent review

# Independent Review

**Status:** passed
**Target commit:** fa4d335eb5d77fd6110b66beffa3ad9a852f2dcc
**Base commit:** 52b525e215e55ba6ab3c36c0c305f1b31ea627f3
**Base ref:** main
**Spec hash:** f974d584f97d00b24eab6be3d364c233d371b53dc490ae37d6a58231b44da6b7
**Prepared by:** codex
**Builder model:** gpt-6.2-astra
**Requested reviewer:** codex
**Requested model:** runtime default (exact model not known until reviewer starts)
**Requested execution:** automatic
**Requested at:** 2026-11-25T20:11:35.471265+00:00
**Workflow:** regular
**Check required:** no
**Reviewer adapter:** codex
**Reviewer model:** gpt-6.2-astra
**Reviewer context:** fresh subagent
**Actual execution:** automatic
**Reviewed at:** 2026-11-25T20:13:13.577872+00:00
**Scope:** current
**Lenses:** quality, security, performance, tests
**Verdict:** passed
**Check result:** not-required

## Commands

- `EW_VERIFY_BASE=main bash .github/scripts/engineering-verify` passed.
- `node --test engineering-workflows/builder/*.test.mjs engineering-workflows/mission/mission-controller.test.mjs` passed all 19 tests with zero skips or placeholders.
- Git status, HEAD, merge base and the SHA-256 of the tracked spec matched the handoff.

## Evidence

- Reviewed the full 24-file delta across the builder entry points, role containers and session transport, controller persistence and transitions, delivery, tests, skills and operator documentation. The review excluded the two evidence files from the product delta.
- Traced workspace mounts and disposability, handoff identity, approval and repair transitions, and delivery checks against the project standards and active spec.
- The role-session regression returned exit 0 and exit 1 with distinct status prefixes, the truncation notice and the expected 24,000-character tails for identical verbose logs.

## Findings

- Closed F-21. No new findings.

## Remaining risk

- Windows Docker, live Pi sessions and private GitHub delivery are covered by the pilot evidence recorded in the spec. The independent run exercised the local regression fixtures.

## Try it now

With Docker pointed at the Windows builder, inspect the saved pilot mission:

```sh
node engineering-workflows/builder-plan.mjs status yairabf/engineering-workflows-pilot 4
```

The output identifies the ticket, saved stage, revision, and next operator action.

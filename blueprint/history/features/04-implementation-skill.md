# Feature: Implementation skill

**From build-plan:** feature 4
**Build attempt:** 1
**Branch:** feature/implementation-skill
**Status:** verified

## Goal

Give a developer in a fresh session the saved, human-approved plan for a task. The developer executes its tasks in a dedicated branch and worktree and returns enough evidence for someone else to review the exact result.

## In scope

- Add the installable `workflow-implement` role to the Engineering Workflows pack.
- Accept the approved revision directly or by reference. For a tracked task, follow its attached or linked plan. For a local mission, read the saved plan file.
- Follow target repository rules, perform the planned changes, run the specified checks, and return a Markdown handoff that identifies unfinished work.

## Out of scope

Plan authorship, saving or attaching plans to tickets, tracker integrations, combining investigation and planning, automatic dispatch, independent review, repair orchestration, and PR delivery are outside this feature.

## Build loop

Implement the steps in order. Review the feature as a whole. Checkpoint commits are disabled. After review and verification, `/complete` creates the final pack feature commit. The candidate commit described below belongs to the target repository during use of the installed role.

## Build steps

1. [x] Define the developer role and handoff in the pack using the existing shared skill and adapter conventions. Specify how to resolve the approved input, establish the target base, work in isolation, run the planned tasks and checks, and report the outcome. **Done when** a walkthrough with the existing CLI pilot plan produces an actionable sequence from approval to candidate evidence, and a pending or inaccessible plan stops before target changes.
2. [x] Register the role through the existing pack installer and readiness checks. Inspect role lists used for installation, harness discovery, and remote planning against their purpose. Preserve the remote planner's read-only execution. **Done when** a clean fixture installation exposes the role and its handoff instructions through the existing adapters, readiness detects a missing required role file, and the existing planning entry point still ends at the approval handoff.
3. [x] Document manual invocation and exercise it with the disposable CLI fixture. Start a fresh developer session with an approved copy of the pilot plan, execute the help-text task, and capture the resulting handoff outside the target. **Done when** the handoff SHA resolves to the change on the dedicated branch, the reported help command reproduces the acceptance result at that SHA, and the original checkout retains its starting branch, files, and HEAD. Exercise an unfinished task or unavailable check and verify the handoff identifies it. Run pack Verify.

## Files / areas

- `engineering-workflows/.agents/skills/workflow-implement/` for the role and handoff format, with the matching adapter under `engineering-workflows/.claude/skills/`.
- `engineering-workflows/install.mjs`, `engineering-workflows/readiness.mjs`, and the Initiate readiness reference for installation and discovery. Check the role catalog in `engineering-workflows/builder/stage.mjs` for discovery dependencies.
- `engineering-workflows/README.md` and `engineering-workflows/workflows/development.md` for operator instructions and the disposable pilot.

## Data / contracts

- **Input.** Identify the target repository and the exact plan revision the human approved. Use the plan's mission and investigation references for context. A ticket assignment alone conveys no plan approval. If the plan is missing, inaccessible, pending, or materially changed since approval, identify the missing input or approval before editing.
- **Execution.** Use a dedicated branch and worktree based on the target repository's specified base. Preserve existing work when a branch or path is occupied. Follow the plan's tasks, acceptance criteria, verification steps, and applicable repository commands. If execution requires a material change to scope or acceptance criteria, report the decision needed for a revised plan.
- **Output.** Return Markdown identifying the approved plan, branch, worktree, full candidate commit SHA when one exists, completed and unfinished tasks, and the actual command and observed result for each check. Identify failed, skipped, or unavailable checks and the reason. If work stops before a candidate exists, say so explicitly. Keep real handoffs outside the pack and credentials out of evidence. The reviewer can use the original mission, approved plan, commit, and evidence without the developer's chat or self-assessment.

## Testing

Use the documented pack Verify command, `bash .github/scripts/engineering-verify`. Check changed links and installation paths. Exercise installation through the supported entry point from a clean pack revision and use a disposable target for the role walkthrough. Record which harness and checks were actually exercised. Pack Verify passed during planning and after implementation. A fresh Codex developer session executed the approved disposable CLI plan on a dedicated branch. Candidate `7701ebe7cca4b031116577897bc3e45a448d13c2` reproduced the expected help. The handoff recorded the unavailable supplemental `node verify.mjs` check. The original checkout retained its branch, HEAD, files and status. Local fixture checks covered installation, repeat installation, adapter resolution, required handoff resources and the three-role readiness scope of the pinned remote planner. Live remote planning was not exercised.

## Notes for the AI

Use the Planner's existing human approval section and the target's existing Git and verification commands. The same developer input works whether an operator supplies it manually today or a dispatcher supplies it later.


<!-- blueprint:completion {"schemaVersion":2,"specBytes":5867,"specSha256":"c60d19aeff2829339cb4e388aa1ea551b39649a5989ff19a03e8cf1c8ac6dc56","branch":"refs/heads/feature/implementation-skill","head":"bba14919bb7c24d91031874838fd805d1b0290ea","baseRef":"refs/heads/main","baseCommit":"bba14919bb7c24d91031874838fd805d1b0290ea","sourceTree":"8899060eed118279c1275491f6b414228ddf299e","landing":"local-merge","absentOptional":[]} -->

## Live builder verification

A fresh Pi process in the Canvas writer container executed the approved CLI plan over Docker via SSH. Candidate `29b58c8db9f51203a89f1029313b9d8515535b17` on `docs/output-help` reproduced the documented option with `node cli.mjs --help`. The original checkout kept its base commit, old help and clean status. The developer handoff recorded the deliberately unavailable supplemental check. This pilot used the staged role and exercised manual execution.

## Try it now

Run or do:

In a builder Canvas chat with access to the pilot folder, ask: “Read `/projects/ew-developer-pilot.OJc1gj/handoff/result.md` and show me its contents.”

Expected:

The handoff identifies the approved plan, candidate SHA, completed CLI change, passing help check and unavailable supplemental check.

This proves:

The developer produced a reviewable handoff for the saved plan.

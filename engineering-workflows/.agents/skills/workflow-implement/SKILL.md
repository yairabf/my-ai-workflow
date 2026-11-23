---
name: workflow-implement
description: Execute a saved, human-approved plan in a dedicated Git worktree and return the candidate commit and verification evidence.
disable-model-invocation: true
---

# Developer

Start in a fresh session with the target checkout and the approved plan or a reference to its approved revision. For a tracked task, read the attached or linked plan using available authorized access. For a local mission, read the saved file. Use its mission and investigation references for context.

1. Before writing, confirm the target, the target repository's base branch, and the human's explicit approval of this plan revision. A ticket assignment or a pending decision is insufficient. If the plan is inaccessible, approval is unclear, or the plan materially changed after approval, return the missing input or decision. Leave candidate, branch, and worktree fields empty with a reason.
2. Read target repository instructions. From the target root, inspect the base and existing worktrees.
   - For a new assignment, use the target's branch naming rules and a free sibling worktree path. Run `git worktree add -b "$branch" "$worktree" "$base"` with the resolved values. If a name or path is occupied, preserve it and select a free one, or report the collision if the assignment requires that exact location. Keep the original checkout and its local changes intact.
   - For a repair, use the saved implementation handoff and the review requesting changes. Verify the repository, dedicated worktree path and checked-out branch, and confirm that its full HEAD SHA matches the reviewed candidate. If they disagree or local edits would interfere, report the discrepancy before editing. Resume in that worktree.
3. In the dedicated worktree, execute the approved tasks and check their acceptance criteria. For repairs, trace each requested correction to its finding and retest the affected behavior. Run the plan's checks and applicable repository commands. Fix in-scope defects and rerun affected checks. If a material change to scope or criteria is needed, preserve progress and return the decision required for renewed approval.
4. Inspect the diff, stage only mission changes, and commit the candidate according to repository rules. Record the full SHA with `git rev-parse HEAD` in the dedicated worktree. Tie reported checks to that exact content and rerun affected checks after edits. If an operation fails or work stops early, identify any unfinished or uncommitted changes and distinguish them from what the SHA contains. Report the absence of a candidate explicitly if no candidate commit was produced.
5. Return the [implementation handoff](references/implementation-handoff.md) as Markdown for the operator to save beside the plan outside the pack. Retain the branch and worktree for review. End the session at handoff.

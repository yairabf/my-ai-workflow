# Feature: Review and repair loop

**From build-plan:** feature 6
**Build attempt:** 1
**Status:** verified
**Branch:** feature/review-and-repair-loop

## Goal

An operator can take a candidate from its first review through repair, independent retesting, and either delivery of the passing SHA or escalation to a human.

## In scope

- Extend the existing developer and reviewer procedures and their Markdown handoffs. Keep the original mission and human-approved plan revision as the basis for each review.
- Record the back-and-forth beside the mission, outside the target repository. Preserve the initial review and the evidence for each round. Use the existing handbook and README to explain who acts next.

## Out of scope

Automated orchestration, a separate history database or index, changes to PR or CI machinery, and the end-to-end sample mission planned for feature 8.

## Build loop

Use feature-level review with checkpoint commits disabled. Verify each step locally. The operator reviews the combined change. Use `/complete` for the final feature commit.

## Build steps

- [x] **1. Make the developer handoff usable for repairs.** Extend the shared implementation procedure and handoff template. On receiving a completed review requesting changes, verify the reviewed commit and resume from it in the original candidate branch and worktree. Address each required finding against the approved plan, run the affected checks, and return the new full commit SHA and factual evidence. Surface branch or worktree discrepancies before editing. Route material plan changes through existing human approval. **Done when** a walkthrough from a saved finding identifies the correct worktree, the requested correction, the revised SHA, and the command and observed result for that correction.
- [x] **2. Make each revised commit independently reviewable.** Extend the shared reviewer procedure and report template. Start a fresh read-only session for each revised SHA. Supply the mission, approved revision, repository and intended base, previous review, revised SHA, and factual test evidence. Recheck the original requests, the full candidate against the approved criteria, and the existing Thermo approval bar. Retest affected behavior against the revised SHA within read-only access. When a check requires writes, obtain fresh SHA-specific results from the developer. Record any incomplete correction as the original request, observed behavior, and remaining required change. **Done when** a report walkthrough distinguishes a resolved finding, a remaining or new required change, and missing evidence, with the existing verdict rules applied to the exact reviewed SHA.
- [x] **3. Connect the operator handoffs and stopping rules.** Document the sequence and filenames below in the development workflow and link to it from the pack README. Show what the operator supplies at escalation. **Done when** the operator can trace a first- or second-repair pass, a blocked review and resumption, and two unsuccessful repairs to the correct next actor using the saved records. Check changed links and run Verify.

## Files / areas

- `engineering-workflows/.agents/skills/workflow-implement/SKILL.md` and `references/implementation-handoff.md` in that skill.
- `engineering-workflows/.agents/skills/workflow-review/SKILL.md` and `references/independent-review.md` in that skill.
- `engineering-workflows/workflows/development.md` and `engineering-workflows/README.md`. The Claude adapters already link to the shared procedures.

## Data / contracts

- The initial review remains beside the mission. Its first **Changes requested** opens repair round 1 with zero unsuccessful repairs. The operator gives the developer the actual review and its candidate SHA.
- For round N, save the developer handoff as `repair-N.md` and the independent verdict as `review-N.md`. Link the handoff to the review requesting changes. Include the branch and worktree, the revised full SHA, the change for each finding, and check commands and results. Link each verdict to its repair handoff and identify the SHA reviewed. Omit credentials, developer chat, and developer self-assessment from review inputs.
- **Changes requested** on a revised commit counts as one unsuccessful repair, regardless of how many required findings remain or whether they are new. After the first, return the findings to the developer for round 2. After the second, pause and give the human both reviewed repair SHAs, the remaining findings, links to the history, and the decision needed before further work.
- **Blocked** records the missing input or evidence and pauses the current review. Resume that round when the input is available. Preserve the blocked verdict and subsequent result in the round's report. Count the completed outcome only once. Any newly submitted commit requires a fresh review.
- **Pass** applies when the checks support approval and no required change remains. Optional suggestions permit a pass. Hand the exact passing SHA to the existing PR and CI workflow. The human retains the merge decision.

## Testing

Walk through the verdict sequences in steps 1–3 using representative Markdown handoffs. Include a second-round pass, a newly discovered required change, and a blocked review resumed on the same SHA. Verify that earlier records remain traceable, each reviewed SHA matches its handoff, and no third repair starts automatically. Check adapter and documentation links. Run `bash .github/scripts/engineering-verify` from the repository root. The planning baseline passed this command. This documentation change has no configured unit or browser test command.

## Notes for the AI

Reuse the existing verdict vocabulary, evidence requirements, handoff templates, and operator-owned files. Keep the reviewer read-only and restrict developer edits to the dedicated worktree.


<!-- blueprint:completion {"schemaVersion":2,"specBytes":5861,"specSha256":"a26796d74014bda8da6085b7f8637461565c2e9268321e7d06188c153c23a62c","branch":"refs/heads/feature/review-and-repair-loop","head":"59186e845df49bd8085252faadaabed1f1884546","baseRef":"refs/heads/main","baseCommit":"59186e845df49bd8085252faadaabed1f1884546","sourceTree":"4cc2b6fcb1a02931248a088751d6a739029e70f5","landing":"local-merge","absentOptional":[]} -->

## Live verification

On the OpenHands builder, the reviewer requested changes on pilot commit 9a61ed3 and passed the developer repair at 5630c4d after retesting CLI help. In the separate escalation fixture, review requested changes at 449ffe0, paused for the approved plan revision at b9e134a, then requested changes on that same SHA. The operator preserved both verdicts and paused for human input after the second unsuccessful repair.

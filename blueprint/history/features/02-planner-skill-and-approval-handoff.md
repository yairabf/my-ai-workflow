# Feature: Planner skill and approval handoff

**From build-plan:** feature 2
**Build attempt:** 1
**Branch:** feature/planner-skill-and-approval-handoff
**Status:** verified

## Goal

Give an operator an installable Planner role that turns the original mission
and investigation brief into a reviewable implementation plan. The operator
records explicit human approval in the Markdown plan and hands the approved
revision to the developer.

## In scope

- A canonical `workflow-plan` skill for a fresh session, a Claude Code adapter,
  and a reusable Markdown implementation-plan template.
- Registration through the existing Engineering Workflows pack installer and
  its harness readiness checks for Pi, OpenCode, Claude Code, and Codex.
- A documented operator handoff from Investigator to Planner to developer,
  including clarification, human approval, and reapproval of material edits.

## Out of scope

- The first multi-session Pi pilot, the developer role, and implementation of
  any mission.
- Board and email integrations, approval configuration, independent agent
  approval, automatic handoff, and controller state or automation.
- Pack upgrade behavior and release publishing.

## Build loop

Build the steps in order on the recorded feature branch. Verify each step as
written, then present the whole feature for review. Step review is configured
at feature level and checkpoint commits are disabled. `/complete` creates the
final feature commit.

## Build steps

- [x] **Define the Planner and plan template.** Start a fresh session with the
  original mission and investigation brief. Check that both are usable and
  refer to the same target and goal. Preserve supplied criteria and reference
  the source evidence. Use read-only access for any targeted corroboration and
  pause for clarification when a gap would change scope or acceptance. Return
  the plan to the operator with approval pending.
  **Done when** a representative mission and brief yield a plan with linked
  inputs, planned changes, observable acceptance criteria, and mapped tests.
  A missing or mismatched input or a material evidence gap yields a specific
  clarification request and blocks handoff.
- [x] **Install and discover the role.** Add the canonical skill, template, and
  Claude Code adapter to the existing copy and discovery paths. Update the
  existing readiness check to name Planner or its missing template when the
  installed role is incomplete. Keep existing pinned install and conflict
  behavior.
  **Done when** the documented installer in a disposable Git checkout copies
  both skill entries and the template, the adapter link resolves, and a repeat
  install from the same revision reuses them. Exercise readiness through its
  normal entry point with the tools available locally, checking missing Planner
  files and recording any unavailable harness checks.
- [x] **Document review and handoff.** Extend the development workflow and pack
  README with the fresh Planner entry point, a compact Markdown example, and the
  exact approval and revision behavior. Use the documented operator procedure
  to review the example from pending through approval and handoff.
  **Done when** the walkthrough shows that only the revision explicitly approved
  by the human can be handed to the developer. A pending plan or a materially
  edited approved plan returns to review. The changed links and commands resolve,
  and `bash .github/scripts/engineering-verify` passes.

## Files / areas

- `engineering-workflows/.agents/skills/workflow-plan/SKILL.md` and
  `references/implementation-plan.md` under the same skill directory.
- `engineering-workflows/.claude/skills/workflow-plan/SKILL.md` for the adapter.
- `engineering-workflows/install.mjs` and `engineering-workflows/readiness.mjs`
  for installation and role discovery.
- `engineering-workflows/README.md` and
  `engineering-workflows/workflows/development.md` for the operator handoff.
- The published Investigator skill and its `references/investigation-brief.md`
  define the incoming brief. Use their existing contract.

## Data / contracts

- **Inputs.** Original mission with target repository and goal, supplied
  acceptance criteria and source reference when available, plus the investigation
  brief with repository context, evidence, assumptions, and open questions.
  Preserve the inspected revision when supplied and label any verification gaps.
- **Output.** One Markdown plan referencing the mission and brief, with planned
  changes, observable acceptance criteria, tests or documented verification tied
  to those criteria, and a human decision section. The operator can save the plan
  beside the mission and brief outside the target checkout and pack.
- **Approval.** The Planner drafts the plan with approval pending. The operator
  records the human's explicit decision in the plan after review. The developer
  receives the exact approved plan through the operator. A material revision
  requires a fresh decision. Requests for changes or clarification keep the plan
  pending. Silence and agent output carry no approval authority.
- **Planning boundary.** Treat the mission, brief, and repository material as
  evidence within the operator's request. Keep credentials out of the handoff
  and leave target files, Git state, and external systems untouched. If needed
  evidence is unavailable, state what could not be confirmed and whether that
  requires clarification before the plan can proceed.

## Testing

- Baseline `bash .github/scripts/engineering-verify` passed during specification.
  Run it again against the implementation.
- Review Markdown links and command examples against the checkout. Use a
  representative handoff walkthrough for valid inputs, missing or conflicting
  inputs, missing material evidence, pending approval, explicit approval, and
  reapproval after a material edit.
- Exercise the changed install and readiness entry points locally and record
  the checks actually observed. The repository has no configured unit or browser
  test runner. The first Pi pilot remains feature 3.

## Notes for the AI

- Follow the existing Investigator role layout and thin adapter pattern. Keep
  the approval record in the Markdown plan and use the existing manual handoff.
- Use the target project's documented verification commands in each generated
  plan when available. Record missing commands as gaps and keep proposed checks
  distinct from checks that actually ran.


<!-- blueprint:completion {"schemaVersion":2,"specBytes":6482,"specSha256":"204f7d0a5c3c9bcbba273d9acd88ffdf2eef6a4d4f14847ae431584caec67b26","branch":"refs/heads/feature/planner-skill-and-approval-handoff","head":"5aa1f0220a8880552b594d8d807978e2edf97ab6","baseRef":"refs/heads/main","baseCommit":"5aa1f0220a8880552b594d8d807978e2edf97ab6","sourceTree":"bf572f2a80b3ac45f1092648785530b428c2f3ae","landing":"local-merge","absentOptional":[]} -->

## Try it now

From a clean checkout of the completed revision, run:

```sh
planner_try_target=$(mktemp -d)
git -C "$planner_try_target" init -q
node engineering-workflows/install.mjs "$planner_try_target"
cat "$planner_try_target/.agents/skills/workflow-plan/references/implementation-plan.md"
```

Expect `Installed Engineering Workflows at` followed by the source commit.
The installed implementation plan template starts with a pending human decision.
This checks that the role-only installer ships the Planner's template.

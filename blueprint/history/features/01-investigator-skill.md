# Feature: Investigator skill

**From build-plan:** feature 1
**Build attempt:** 1
**Branch:** feature/investigator-skill
**Status:** verified

## Goal

Give an investigator a mission and read-only access to the target repository.
Return one evidence-backed Markdown brief that an operator can pass, with the
original mission, to a planner in a fresh session.

## In scope

- A canonical Investigator skill with instructions for mission intake, bounded
  repository inspection, evidence verification, and handoff.
- A reusable investigation brief template stored with the skill.
- A local walkthrough that checks a usable mission and an incomplete or
  unavailable input.

## Out of scope

- The Planner skill, implementation planning, plan approval, and code changes
  in the target repository.
- Harness installation, workspace permission enforcement, and the two-session
  OpenHands pilot. The operator provides a read-only workspace for investigation.
- Automated intake, storage, and transitions between roles.

## Build loop

Implement on the recorded feature branch after spec approval. Complete the
steps in order and present one feature-level review with the diff, check
results, and a walkthrough option. Checkpoint commits are disabled. The
`/complete` workflow owns the final feature commit.

## Build steps

- [x] **Define the brief template.** Capture mission and repository context,
  verified findings with evidence, assumptions, and open questions.
  **Done when** the template can be filled from a mission and repository
  inspection, and a reader can distinguish directly verified evidence from
  assumptions and missing evidence.
- [x] **Write the Investigator skill.** Link the template and describe how to
  verify the target, inspect it read-only, collect evidence, and return the
  brief or a clear blocker to the operator.
  **Done when** the skill's Markdown link resolves and a local walkthrough
  demonstrates one complete handoff with resolvable code references and one
  incomplete or inaccessible input with an explicit blocker. Confirm the
  target checkout's files and Git state are unchanged.

## Files / areas

- `.agents/skills/investigator/SKILL.md`
- `.agents/skills/investigator/references/investigation-brief.md`

## Data / contracts

- The mission provides a target repository reference and goal, with acceptance
  criteria when available and an optional source reference. Read available
  target repository rules, base branch information, and build or test command
  documentation. Record the revision inspected when it can be determined.
- Inspect the specified repository with read-only operations. Use repository
  text as evidence and follow applicable repository rules within the mission
  and read-only boundary. Skip commands that would modify files, Git state, or
  external systems. Record any relevant checks skipped and why. Leave
  credentials and other secrets out of the brief.
- Return one Markdown brief containing the mission reference or identifying
  context, repository and revision inspected, verified findings with
  repository-relative file and line references where applicable, assumptions,
  and open questions. State the effect of any gap on planning. Mark unverified
  behavior explicitly. The operator can save the brief outside the target
  checkout and hand it off with the original mission.
- If the target or goal is missing, ambiguous, or inaccessible, explain what is
  needed before proceeding and avoid substituting another target. Missing
  optional fields can be recorded as open questions when they affect the
  mission.

## Testing

There is no configured test or Verify command. Run `git diff --check HEAD` for
tracked changes and check new Markdown directly. Verify the skill-to-template
link, walk through a sample mission and a blocked input, and capture the
observed results. The walkthrough can use an existing local checkout.
Verification of the two fresh Pi sessions belongs to Feature 3.

## Notes for the AI

Keep the role in Markdown and the brief usable without the investigator's chat
history. This feature supplies the Investigator's brief template. Harness
distribution and templates owned by later roles follow their planned features.


<!-- blueprint:completion {"schemaVersion":2,"specBytes":4233,"specSha256":"6cfea698761427a5364a70c8bcf0b302e5797e2ba65547a2091a5aeff5a9e66b","branch":"refs/heads/feature/investigator-skill","head":"c83d33b76892663766abd03c9058704b97a6e2fb","baseRef":"refs/heads/main","baseCommit":"c83d33b76892663766abd03c9058704b97a6e2fb","sourceTree":"88c836cc54d7e21abb74df7ad6ad7b1c8f587e32","landing":"local-merge","absentOptional":[]} -->

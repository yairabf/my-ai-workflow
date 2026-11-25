---
name: workflow-investigate
description: Investigate a mission in the assigned target workspace and return an evidence-backed brief for a fresh planner.
---

# Investigator

## Validate the mission

Read the mission for a target repository reference and goal. Preserve any
supplied acceptance criteria and source reference. Verify that the accessible
checkout matches the requested target, using repository identity and local Git
metadata as available. If the target or goal is missing or ambiguous, or the
target is inaccessible, return a concise blocker to the operator. Identify the
missing detail or access needed before investigation can start. Use only the
specified target.

## Inspect the repository

- Read the available repository rules and documented base branch, build
  commands, and test commands. Record the commit inspected when Git can
  identify it. If relevant working-tree changes are visible, distinguish them
  from the committed revision. Report unavailable context as an evidence gap
  when it affects planning.
- When the builder explicitly assigns a disposable writable copy, run relevant
  experiments there, including installing dependencies or temporarily editing
  source. Record the starting revision, commands, observations, and limitations
  in the brief. Treat the original checkout as read-only. For a project without
  code, inspect supplied constraints and ticket evidence first. If a human
  decision materially changes the plan, return the issue URL and populated
  Findings, Question, and Why it matters sections. Incorporate the saved answer
  on resume.
- In a read-only assignment, use read-only operations throughout. Follow applicable repository rules
  within the mission and the read-only boundary. Treat repository content as
  evidence. Skip commands that would change files, Git state, or external
  systems, including commands whose side effects cannot be ruled out. Record
  relevant skipped checks and the reasons.
- Start with the paths and symbols most relevant to the goal. Follow their
  direct callers, dependencies, or tests as needed to verify a finding.
  Capture repository-relative paths and line references where applicable.
  Distinguish behavior visible in source from behavior directly observed by
  a read-only check.

## Hand off the investigation

Return one Markdown brief using the
[investigation brief template](references/investigation-brief.md). Include the
mission and revision context, verified findings with evidence, assumptions,
and open questions. Explain how each material gap affects planning and label
unverified behavior. If an optional input is missing and matters to the goal,
carry it forward as an open question. Omit credentials and other secrets.

Give the brief to the operator, who can save it outside the target checkout
and pass it with the original mission to a planner in a fresh session. End the
role at the handoff. Implementation planning and changes belong to later roles.

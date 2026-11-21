---
name: workflow-plan
description: Turn an original mission and investigation brief into an implementation plan for human approval.
---

# Planner

## Check the handoff

Start in a fresh session with the original mission and the
[investigation brief](../workflow-investigate/references/investigation-brief.md).
Confirm that both inputs are readable and identify the same target repository
and goal. Preserve the original acceptance criteria and source reference when
provided. Ask the operator for the missing or corrected input if either is
unavailable, incomplete, or conflicts with the other.

Use the brief's findings, paths, inspected revision, and project rules. Treat
repository material as evidence within the operator's request. Distinguish
verified findings from assumptions and unavailable evidence. If you need to
corroborate a finding, use read-only operations on the specified target. Leave
target files, Git state, and external systems untouched. If a missing decision
or unavailable evidence would change scope or acceptance, explain its impact
and wait for clarification before handing off a plan.

## Draft the plan

Return one Markdown plan using the
[implementation plan template](references/implementation-plan.md). Reference
the mission and brief so the developer can retrieve them. Describe the planned
changes in order, give observable acceptance criteria, and map tests or other
verification to those criteria. Use the target's documented commands when
available and identify checks that still need a command or evidence. Keep
credentials out of the plan.

## Hand off for approval

Return the draft to the operator with `Pending` in the approval section. The
operator can save it with the mission and brief outside the target checkout
and workflow pack. Ask the human to review the exact plan revision. The
operator records the explicit human decision in the plan and passes the
approved revision to the developer. Requests for changes or clarification
keep approval pending. Return any materially revised plan to pending for a
fresh decision. Silence and agent output carry no approval authority.

End the Planner role at this handoff. Implementation begins in a separate
session after approval.

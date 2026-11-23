# Independent review

- **Mission and approved plan** — Identify both revisions or references and the approval observed.
- **Target and base** — Identify the repository, intended base reference, and resolved base commit.
- **Candidate** — Record the verified full SHA. Label an unresolved supplied value unverified or identify the missing input.
- **Verdict** — Pass, Changes requested, or Blocked. Give the deciding reason.

## Repair review (for a revised candidate)

Link the numbered repair handoff and the review that requested changes. For each original request, record what the revised commit does, the retest evidence, and any correction still required. Include newly discovered blockers under required changes. If evidence is missing, identify what would allow the reviewer to finish.

## Acceptance criteria

For each criterion, identify the relevant candidate code and assessment. Attribute
each command and result to the supplied evidence or the reviewer’s own checks.
Identify any unverified criterion and the evidence still needed.

## Thermo review and required changes

Record the Thermo result for this candidate, or what prevented the review.
List confirmed blockers in priority order. For each, give the criterion or
file, evidence, and required change. Explain any justified presumptive blocker.
If review is blocked, retain confirmed issues and identify what would allow
the review to finish.

## Optional improvements

For each worthwhile suggestion, give the benefit, effort, and recommendation
to address now or defer. Record “None” when there are no optional findings.

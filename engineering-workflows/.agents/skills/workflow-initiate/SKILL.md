---
name: workflow-initiate
description: Prepare a target Git checkout's workflow prerequisites before an investigation in Pi, OpenCode, Claude Code, or Codex.
disable-model-invocation: true
---

# Initiate

Run this role with the operator's authorized target checkout and selected
mission harness (`pi`, `opencode`, `claude-code`, or `codex`). If either
input is missing or unclear, ask for it before acting. Identify the Git root
from the supplied path and confirm that it is the intended target and an
accessible, non-bare worktree. Follow the target's repository instructions.
Resolve the companion references relative to this skill, then run
target commands from the target root unless a step specifies a staging folder.

## Read existing readiness

Follow the [readiness reference](references/readiness.md) to inspect the local
marker. Stop on an invalid or unreadable marker and identify the file that
needs attention. If the selected harness is recorded, run its read-only quick
check. On success, report that setup was skipped and give the operator the
investigation handoff. On failure, identify the affected prerequisite or
runtime and stop before investigation. Leave the marker and installations
untouched on either repeat path.

## Prepare missing prerequisites

Use the [preparation reference](references/preparation.md) for the only six
prerequisites and their sources. Work within the operator's write access.
Reuse complete checkout-local or already discoverable installations. Prepare
missing checkout-local skill registrations for all four harnesses, including
ones that are currently absent. Preserve an existing destination with missing
or conflicting resources and report the repair needed. Continue independent
preparation when one source or destination fails.

## Verify and hand off

Follow the [readiness reference](references/readiness.md) for each available
harness. Record only successful verification. Report each harness as ready,
pending because its executable is absent, or requiring repair or a concrete
verification step. On repeat entry, describe other harnesses as previously
verified or unverified unless you actually ran their current check.

Apply setup only to the requested target and the authorized Graphify CLI
installation. Once the selected harness is ready, hand the target reference,
mission goal, and any acceptance criteria or source reference to
[`workflow-investigate`](../workflow-investigate/SKILL.md) in a fresh session
with read-only target access.

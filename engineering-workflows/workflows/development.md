# Development workflow

1. Start [`workflow-initiate`](../.agents/skills/workflow-initiate/SKILL.md) with
   the target checkout path and the harness you will use. Authorize setup
   writes when prerequisites need installation. Initiate reports whether the
   selected harness is ready and what to repair if a check fails.
2. Once ready, start [`workflow-investigate`](../.agents/skills/workflow-investigate/SKILL.md)
   in a fresh session with read-only target access. Give it the target
   reference, goal, and any acceptance criteria or source reference.
3. Take the returned investigation brief and original mission to a fresh
   planning session.

On later missions, Initiate skips setup when the recorded harness passes
its quick check.

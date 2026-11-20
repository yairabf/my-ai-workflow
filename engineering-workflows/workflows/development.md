# Development workflow

1. Follow the [one-command setup](../README.md) from the target checkout.
   If your selected harness reports pending, use
   [`workflow-initiate`](../.agents/skills/workflow-initiate/SKILL.md) to verify
   its installed skills in its first session.
2. Once ready, start [`workflow-investigate`](../.agents/skills/workflow-investigate/SKILL.md)
   in a fresh session with read-only target access. Give it the target
   reference, goal, and any acceptance criteria or source reference.
3. Take the returned investigation brief and original mission to a fresh
   planning session.

On later missions, Initiate skips setup when the recorded harness passes
its quick check.

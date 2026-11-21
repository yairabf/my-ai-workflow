# Build Plan

## First milestone — Initiation, investigation, and planning

- [x] 15. **Initiate target repository** — Install Initiate and Investigator as a workflow pack, prepare and verify the six prerequisites before investigation, and record checkout readiness for later missions.

- [x] 1. **Investigator skill** — Turn a mission into a read-only investigation brief with code references, verified findings, assumptions, and open questions.
- [ ] 2. **Planner skill and approval handoff** — Give a fresh planner the mission and brief so it can produce a plan with acceptance criteria and tests for human approval.
- [ ] 3. **Harness setup and first pilot** — Document how to load the shared skills in Pi, OpenCode, Claude Code, and Codex, then verify first-time initiation, repeat entry, and the handoff in two fresh Pi sessions on the OpenHands builder.

## MVP — Manual development workflow

- [ ] 4. **Implementation skill** — Use the approved plan to make changes in a dedicated branch and worktree, then record the candidate commit and test evidence.
- [ ] 5. **Independent review skill** — Review the exact candidate commit in a fresh, read-only session using the mission, approved plan, code, and test evidence.
- [ ] 6. **Review and repair loop** — Send blocking findings back to the coder, review each revised commit in a fresh session, and pause for human input after two unsuccessful repair attempts.
- [x] 7. **GitHub delivery and CI** — Open a PR after review passes, include the plan and evidence, run the target repo’s CI, and leave the merge decision to a human.
- [ ] 8. **End-to-end workflow example** — Run a sample mission through plan approval, a requested fix, a passing review, and a GitHub PR with CI results.

## After the MVP — Installation and automation

- [ ] 9. **Versioned skill installer** — Install or update a pinned version of the shared skills in a target repo while preserving local edits.
  - [x] 9a. **One-command setup** — From a target Git project, run one version-pinned command that installs Initiate, Investigator, and all six prerequisites, reuses working installations, and reports anything that needs repair.
  - [ ] 9b. **Safe upgrades** — Update the installed pack to another pinned version while preserving local edits.
  - [ ] 9c. **Private package release** — Publish a versioned Engineering Workflows package to GitHub Packages and verify the short npm setup command in a fresh Git project.
- [ ] 10. **Mission controller** — Record mission state and automate role handoffs, plan approvals, bounded retries, and recovery after restarts.
- [ ] 11. **OpenHands execution adapter** — Start separate agent sessions on the builder, apply role-specific workspace access, and capture each stage’s output.
- [ ] 12. **MCP mission interface** — Let external clients submit missions and check their status through a common interface.
- [ ] 13. **GrokBot and Hermes integration** — Teach each bot how to submit a mission, show a plan awaiting approval, and report the resulting PR.
- [ ] 14. **Trello and GitHub Issues intake** — Turn selected cards and issues into missions without changing how the workflow runs.

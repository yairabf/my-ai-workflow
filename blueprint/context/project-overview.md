# My AI Workflow - Project Overview

<!-- blueprint:source-hash be6415773456e0a920c68345383b8a5138cf5ab175611c4057241bd87bf4be1d -->

> A reusable development workflow and skills pack for Pi, OpenCode, Claude Code, and Codex.

## Problem

Switching repositories or agent harnesses means moving skills and rewriting prompts, which makes handoffs inconsistent. Initiate prepares a target repository before its first mission. A canonical workflow, role skills, and handoff templates give each fresh session the context it needs and let reviewers assess a specific commit independently.

## Users

- **Primary** - One operator managing personal GitHub projects across multiple harnesses.
- **Future** - Individual developers or small teams adopting the workflow across repositories.
- **Future clients** - GrokBot, Hermes, and other tools that submit missions and query progress.

## Usage model

- Pilot with one operator, one test repository, and one mission at a time. Keep the builder on a local or private network.
- The operator runs Initiate with authorized write access before the first investigation. Reuse working installations and record completion only after the selected harness can use Graphify, Grill Me, and thermonuclear code quality review. With a valid marker and all prerequisites available, start investigation directly. If a marked checkout is missing a prerequisite, report what needs repair.
- Start roles in fresh sessions with explicit handoff files. Investigation and review have read-only access. Implementation can write to its dedicated worktree.
- Require human approval of the plan before coding. Pause for a decision when missing information would change scope or acceptance criteria.
- Review the exact candidate commit against the original mission, approved plan, code, and test evidence. Keep the coder's chat and self-assessment out of the review handoff.
- Return blocking findings to the coder. Review each revised commit in a fresh session and pause for human input after two unsuccessful repair attempts. A passing review leads to a PR and target-repository CI. A human decides whether to merge.
- Keep the first release manual. The versioned installer for repeatable updates, controller, MCP server, bot and Trello connectors, and custom dashboard are follow-up work.

## Features

### First milestone

- **Build item 15. Initiate target repository** - Install and verify missing prerequisites, record successful setup, and skip initiation for ready repositories on later missions.

1. **Investigator skill** - Produce a read-only brief with code references, verified findings, assumptions, and open questions.
2. **Planner skill and approval handoff** - Turn the mission and brief into a plan with acceptance criteria and tests for human approval.
3. **Harness setup and first pilot** - Document setup for all four harnesses, verify first-time initiation and repeat entry, and prove the handoff in two fresh Pi sessions on the OpenHands builder.

### Manual MVP

4. **Implementation skill** - Implement the approved plan in a dedicated branch and worktree and record the candidate commit and test evidence.
5. **Independent review skill** - Assess the exact candidate commit in a fresh, read-only session.
6. **Review and repair loop** - Return blocking findings, review revised commits in fresh sessions, and escalate after two unsuccessful repair attempts.
7. **GitHub delivery and CI** - Open a PR after review passes, link the plan and evidence to the reviewed commit, and run target-repository CI.
8. **End-to-end workflow example** - Demonstrate approval, a requested fix, a passing review, and a PR with CI results in a test repository.

### After the MVP

9. **Versioned skill installer** - Install or update pinned skills while preserving local edits.
10. **Mission controller** - Track mission state and automate handoffs, approvals, bounded retries, and restart recovery.
11. **OpenHands execution adapter** - Start separate builder sessions with role-specific workspace access and capture stage outputs.
12. **MCP mission interface** - Accept mission submissions and status queries from external clients.
13. **GrokBot and Hermes integration** - Submit missions, show plans awaiting approval, and report PRs.
14. **Trello and GitHub Issues intake** - Turn selected cards and issues into missions through the common workflow.

## Data model

Manual missions travel as explicit handoff files. These fields describe the information each stage needs. File names and any machine-readable schemas are open.

| Record | Fields |
| --- | --- |
| Target repository setup marker | Repository-local record of completed prerequisite setup. Readiness also depends on prerequisite availability in the selected harness. |
| Mission | Target repository reference, goal text, acceptance criteria when available (list), optional source reference (bot, Trello, GitHub issue, or manual intake) |
| Target repository context | Project rules, base branch name, build and test commands, additional project constraints |
| Investigation brief | Mission reference, code references, verified findings, assumptions, open questions |
| Implementation plan | Mission and investigation brief references, planned changes, acceptance criteria, tests, human approval decision |
| Implementation handoff | Approved plan reference, branch and worktree, candidate Git commit SHA, test evidence (commands and results) |
| Independent review | Candidate SHA, verdict, and findings identifying a relevant acceptance criterion or file and the required change |
| GitHub delivery | PR URL linking the approved plan, reviewed commit, and test evidence, with target-repository CI results |
| Future controller state | Mission reference, current workflow stage, retry history, and references to the handoff records |

The review verdict applies to its recorded SHA. Store reusable workflow definitions, role skills, templates, and sample missions with example outputs in this pack. Keep real mission outputs outside the pack and credentials in the runtime credential store.

## Tech stack

- Versioned Markdown and Git for workflow documentation, templates, and examples.
- Canonical role `SKILL.md` files under `.agents/skills/` with templates in each skill's `references/` directory. Pi, OpenCode, and Codex use the shared skills. Claude Code uses generated or installed copies under `.claude/skills/`.
- Pi through OpenHands in Docker on the Windows builder for the first pilot.
- GitHub branches, PRs, and GitHub Actions in the target repository. A future controller provides the common mission interface used by MCP, bots, and intake adapters.

## Monetization

Personal productivity is the MVP goal. Publishing the pack or offering a hosted controller can be considered after validating reuse across projects.

## UI/UX

Use the harness's existing interface and GitHub. The README guides the operator through selecting a harness, loading skills, and running a sample. Each stage shows its inputs and a representative result. Plans support human approval or clarification. Review findings and PRs trace decisions to acceptance criteria, evidence, and the reviewed commit. A future bot can show the current stage, next action, and plan or PR links.

## Deployment

Distribute the pack through a private GitHub repository. Target projects adopt a pinned tag or commit. The pack requires no build or start command, database, worker, environment variables, health endpoint, or domain. The pilot uses the existing Windows Docker builder. The target repository owns its build, CI, and deployment configuration.

## Open questions

> TODO Assign the canonical workflow document and reusable templates to build-plan items. The project plan names them as MVP deliverables and the build plan leaves their ownership implicit.
>
> TODO Define the prerequisite sources and harness-specific checks, plus the setup marker's path and format, in the Initiate spec.
>
> TODO Identify the test repository and sample mission for the pilot and end-to-end example.

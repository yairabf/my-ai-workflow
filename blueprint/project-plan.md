# Project Plan

## 1. Problem - What problem are we solving?

I want to use the same engineering workflow across my personal GitHub projects, whether the agent runs in Pi, OpenCode, Claude Code, or Codex. Today, changing the agent or the project can mean rewriting prompts, moving skills, and re-explaining what the next agent needs. That makes the handoffs inconsistent, especially when a reviewer needs to assess a change independently.

This repo will hold the canonical development workflow, reusable role skills, handoff templates, and harness setup instructions. A mission follows the same path whether it begins in a bot chat, a Trello card, a GitHub issue, or a manual request. The mission carries a target project, a goal, acceptance criteria when available, and an optional source reference.

The first time a target repository uses the workflow, the operator runs **Initiate** before the investigator session. Initiate uses a prerequisite checklist to identify, install, and verify the required skills for the selected harness. The initial list is Graphify, Grill Me, and the thermonuclear code quality review skill. Reuse working installations. Record successful setup with a repository marker once all required skills are available. On later missions, a valid marker and a quick readiness check let the workflow proceed directly to investigation. If a marked checkout is missing a prerequisite, report what needs repair.

After setup, the workflow starts each mission with investigation and planning. I approve the plan before coding begins. The coder works on a dedicated branch and worktree. A separate reviewer assesses the candidate commit against the original mission and approved plan. The reviewer receives the code and test evidence without the coder’s chat or self-assessment. Blocking findings return to the coder, and the next review evaluates the revised commit in a fresh session. A passing review leads to a GitHub PR and CI. A human decides whether to merge.

The first milestone proves one-time initiation and the investigator-to-planner handoff on one test repo. After that, the MVP adds implementation and review to prove the full manual workflow. A future controller can automate the transitions, approvals, retries, and delivery using those same handoffs.

## 2. Users - Who is this for?

- **Primary user** — Me, managing multiple personal GitHub projects and choosing which coding harness to use.
- **Future users** — Individual developers or small teams who want a repeatable workflow across repos and agents.
- **Future clients** — GrokBot, Hermes, or other tools that submit missions and check progress through a common interface.

## 3. Features - What does the MVP need?

- A canonical development workflow that documents each stage, handoff, and approval.
- An Initiate skill and prerequisite checklist for first-time target-repository setup.
- Portable skills for investigation, planning, implementation, and independent review.
- Reusable templates for the mission, investigation brief, implementation plan, test evidence, and review findings.
- A manual quickstart that proves the investigation and planning handoff in two fresh sessions.
- Setup instructions for Pi, OpenCode, Claude Code, and Codex.
- A test project that demonstrates both a passing review and a finding returned to the coder.
- A documented GitHub delivery process that links the approved plan, reviewed commit, and test evidence to the PR.

## 4. Data - What are we storing?

- **In this repo** — Workflow definitions, skill instructions, handoff templates, harness setup notes, and sample missions with example outputs.
- **In each target repo** — Project rules, base branch, build and test commands, any additional constraints, and a marker recording completed workflow setup.
- **For each real mission** — The source reference, investigation brief, approved plan, candidate commit, test results, review verdict, and PR link. During the manual pilot, these travel as explicit handoff files. A future controller can persist them with the workflow stage and retry history.
- **In the runtime’s credential store** — Model provider and integration credentials. Keep credentials and real mission outputs outside the shared skills repo.

## 5. Tech - What stack are we using?

- **Workflow and templates** — Versioned Markdown in Git.
- **Skills** — One canonical `SKILL.md` per role under `.agents/skills/`, with supporting templates in each skill’s `references/` directory.
- **Harness setup** — Shared skills for Pi, OpenCode, and Codex, with generated or installed copies under `.claude/skills/` for Claude Code.
- **First runtime** — Pi through OpenHands on the Windows Docker builder. Each role starts in its own session.
- **Delivery and CI** — GitHub branches, PRs, and GitHub Actions in the target repo.
- **Future integration** — A small controller with a common mission interface. MCP tools or bot skills can submit missions and query status. Trello and GitHub Issues can supply missions through adapters.

## 6. Monetize - How will this make money?

The initial goal is personal productivity. There is no revenue target for the MVP. If the workflow proves useful across my projects, I can decide later whether to publish the skills pack or offer a hosted controller.

## 7. UI/UX - How should this look and feel?

The README should help me pick a harness, load the skills, and run a sample mission without reading the entire repo. Each stage should show what to give the next agent and what a good result looks like.

The plan should be easy to approve or send back for clarification. Review findings should identify the relevant acceptance criterion or file and explain what needs to change. The PR should make it easy to see what was requested, what was tested, and which commit passed review.

The MVP uses the harness’s existing interface and GitHub. A future bot can surface the current stage, next action, and links to the plan or PR.

## 8. Deployment - Where and how will this ship?

The workflow pack ships as a private GitHub repo. Projects can adopt a specific Git tag or commit so workflow updates are deliberate and reproducible.

The pack itself has no build command, start command, database, worker, environment variables, health endpoint, or domain. The first pilot runs on the existing Windows machine with OpenHands in Docker and Pi configured in that runtime. The target repo supplies its own build commands, CI, and deployment configuration.

## 9. Usage model and constraints

- Start with one operator, one test repo, and one mission at a time. Validate the handoffs before using the workflow across multiple projects.
- Keep the builder on a local or private network for the pilot.
- Run Initiate with authorized write access to the target repository before starting read-only investigation. Record completion only after verifying the required skills for the selected harness.
- Give each role a fresh session and pass context through explicit handoffs. Enforce read-only access for investigation and review and grant the coder write access to its worktree.
- Pause before implementation if a missing decision would change scope or acceptance criteria. Pause for human input after two unsuccessful repair attempts.
- Bind a passing review to the exact candidate commit. A revised commit requires a fresh review.
- Keep the initial scope to the shared pack, operator-led initiation, and manual workflow. The versioned installer is follow-up work. First provide one pinned setup command that installs Initiate, Investigator, and all six prerequisites in a target Git project. Reuse working installations and report what needs repair. Then add safe upgrades that preserve local edits. The automated controller, MCP server, bot and Trello connectors, and custom dashboard are also follow-up work.

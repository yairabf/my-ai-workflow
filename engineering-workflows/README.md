# Engineering Workflows

## Private package release pending

The first release installed successfully from GitHub Packages, but GitHub
listed it publicly despite the restricted publish request. The release workflow
is disabled while private distribution is resolved. Use the GitHub
commit-pinned setup below in the meantime.

[Release run and visibility check](https://github.com/yairabf/my-ai-workflow/actions/runs/44926621910)

## GitHub CI

The setup command installs `.github/workflows/engineering-workflows.yml`
alongside the skills. Commit and push it to the target repository's default
branch to activate automatic OpenCodeReview on ready PRs from branches in
that repository. Draft, fork, and Dependabot PRs skip OpenCodeReview.
Keep the review advisory.

In the target repository's GitHub Actions settings, add the
`OCR_LLM_URL` and `OCR_LLM_AUTH_TOKEN` secrets for the approved model
endpoint. Set the `OCR_LLM_MODEL` variable and set `OCR_LLM_PROTOCOL` to
`openai`, `openai-responses`, or `anthropic` as appropriate for the endpoint.
The provider receives code as review context. An eligible run with missing
settings fails with a configuration message. Find completed reviews on the PR
and in the review job summary.

If the project already runs its verification checks for PRs, use that check.
To enable the installed workflow's Verify job, create
`.github/scripts/engineering-verify` in the target repository. Put any
runner setup and the project's normal Verify command in that Bash recipe,
document the local invocation from the project root, and set the Actions
variable `EW_VERIFY` to `enabled`. CI supplies the PR base commit as
`EW_VERIFY_BASE` for recipes that check the change range. With the variable
unset, the job is skipped and labeled as needing setup or project-owned CI.
When enabling merge protection, select the actual Verify check under GitHub's
required status checks after the job has reported its first result.

## GitHub commit-pinned setup

Run setup from the root of the Git project you want to prepare. Replace
`<commit>` with the full commit SHA of a published revision that includes this
installer. Use Git, Node.js 22 or newer, npm 12 or newer, Python 3, and your
existing SSH access to the GitHub repository. If Graphify is missing, setup can
install its CLI with `uv` or `pipx`.

```sh
npx --yes --allow-git=root --package='git+ssh://git@github.com/yairabf/my-ai-workflow.git#<commit>' -- engineering-workflows setup
```

Setup registers `workflow-initiate`, `workflow-investigate`, `workflow-plan`, `workflow-implement`, and `workflow-review` and prepares
Graphify, Grill Me, thermonuclear code quality review, Taste, Impeccable, and UI UX
Pro Max for Pi, OpenCode, Claude Code, and Codex. It stores the source commit
in `.engineering-workflows/revision.txt`. The npm Git flag applies only to
this invocation.

- **Ready.** The harness passed discovery and runtime checks. Start the
  Investigator in a fresh read-only session.
- **Pending.** Setup prepared registrations, but the harness is unavailable or
  a check needs its first interactive session. Use `workflow-initiate` to confirm
  discovery and any reported runtime check when the harness is available.
- **Repair needed.** Address the reported skill, runtime, or path. Rerun the
  same pinned command if installation failed, or repeat the readiness check
  if a previously ready harness failed its quick check.

Repeating installation from the same revision reuses matching files. If an
installed path differs, the installer names that path and exits. Resolve the
conflict before rerunning. The installer leaves existing project instructions,
agent configuration, and the Git index in place.

The original role-only installer is available from a clean workflow-pack
checkout with `node engineering-workflows/install.mjs /absolute/path/to/target-repository`.

## Load the skills in your harness

Open the prepared target checkout in the harness that will run the mission.

| Harness | Find and load project skills |
| --- | --- |
| Pi | In a fresh Pi terminal session, use `/skill:` completion and check the startup resources. Invoke a role by name, for example `/skill:workflow-initiate`. The shared roles live under `.agents/skills/`. For Agent Canvas, follow the pilot discovery steps below. |
| OpenCode | Run `opencode debug skill` from the target root. Check that the mission agent can load the definitions under `.agents/skills/`, then name the role in the session and ask the agent to load it. |
| Claude Code | In a fresh session, use slash-command completion to find the roles registered under `.claude/skills/`. Invoke the role, for example `/workflow-initiate`. |
| Codex | In a fresh session, use `/skills` to check that the roles under `.agents/skills/` are enabled. Invoke a role by name, for example `$workflow-initiate`. |

Use the [preparation checklist](.agents/skills/workflow-initiate/references/preparation.md)
for prerequisite locations, including harness-specific Impeccable builds, and
the [readiness reference](.agents/skills/workflow-initiate/references/readiness.md)
for discovery, loading, and runtime checks. If the harness is unavailable,
leave its readiness pending until you can run those checks in that harness.
If a recorded harness fails its quick check, repair the reported prerequisite
before starting the Investigator.

Once the selected harness is ready, start `workflow-investigate` in a fresh
read-only session. Then start `workflow-plan` in another fresh session with
the mission and the returned brief. Follow the [sample mission and Pi pilot](workflows/development.md#first-pi-pilot)
for the inputs, expected outputs, and approval handoff. Once approved, give the
saved plan or its task attachment to `workflow-implement` in a fresh session
with access to create a dedicated branch and worktree. Save the returned
implementation handoff beside the plan. Start `workflow-review` in a fresh
read-only session for the exact candidate and save its Markdown verdict beside
the mission. Use the [review and repair loop](workflows/development.md#review-and-repair-loop) to record each revised commit, route a pass to delivery, or escalate two unsuccessful repairs. For the pilot, follow the [review walkthrough](workflows/development.md#review-the-pilot-candidate).

## Plan a GitHub ticket on the builder

The pack CLI exposes `engineering-workflows plan OWNER/REPO ISSUE_NUMBER` and
`engineering-workflows get OWNER/REPO ISSUE_NUMBER` in revisions that include
the builder commands. From this pack checkout, use the equivalent commands below.
Use Node.js 22 or later and point the Docker CLI at the configured Windows builder
using its active context or `DOCKER_HOST=ssh://user@builder`.

```sh
node engineering-workflows/builder-plan.mjs plan OWNER/REPO ISSUE_NUMBER
node engineering-workflows/builder-plan.mjs get OWNER/REPO ISSUE_NUMBER
```

`plan` opens or reuses the checkout, checks readiness, and prints the pending Markdown
plan. The operator can invoke it directly or from a harness with shell access.
`get` retrieves the last completed plan for that repository and issue. A failed
rerun leaves the previous plan available. See the [builder pilot](workflows/development.md#remote-ticket-planning)
for first-use requirements and the project-switching check.

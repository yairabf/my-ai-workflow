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

Setup registers `workflow-initiate` and `workflow-investigate` and prepares
Graphify, Grill Me, thermonuclear code quality review, Taste, Impeccable, and UI UX
Pro Max for Pi, OpenCode, Claude Code, and Codex. It stores the source commit
in `.engineering-workflows/revision.txt`. The npm Git flag applies only to
this invocation.

- **Ready.** The harness passed discovery and runtime checks. Start the
  Investigator in a fresh read-only session.
- **Pending.** Setup prepared registrations, but the harness is unavailable or
  a check needs its first interactive session. Use `workflow-initiate` to confirm
  discovery and any reported runtime check when the harness is available.
- **Repair needed.** Address the reported skill, runtime, or path and rerun the
  same pinned command.

Repeating installation from the same revision reuses matching files. If an
installed path differs, the installer names that path and exits. Resolve the
conflict before rerunning. The installer leaves existing project instructions,
agent configuration, and the Git index in place.

The original role-only installer is available from a clean workflow-pack
checkout with `node engineering-workflows/install.mjs /absolute/path/to/target-repository`.
See the [development workflow](workflows/development.md) for the handoff.

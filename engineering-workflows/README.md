# Engineering Workflows

## Private package release pending

The first release installed successfully from GitHub Packages and failed
the visibility check. The public repository's workflow is disabled and
its current definition only inspects the package. Use the GitHub
commit-pinned setup below while the private release is pending.

[Release run and visibility check](https://github.com/yairabf/my-ai-workflow/actions/runs/44926621910)

### Publish as the package owner

Use Git, a current GitHub CLI, Node.js 22 or newer, and npm 12 or newer.
Start from a clean checkout of the reviewed `main` at
`yairabf/my-ai-workflow`. Supply `GH_TOKEN` in the environment with a
classic personal access token owned by `yairabf` with `read:packages`
and `write:packages`. The release uses the personal namespace and an
unlinked manifest so GitHub applies its private default on creation.

[GitHub npm registry authentication and visibility](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-npm-registry)

Run the read-only check first from the repository root.

```sh
node engineering-workflows/check-package-visibility.mjs before
```

Proceed only if GitHub confirms the package is private or confirms it
is absent from the authenticated owner's package list. On any other
visibility, access failure, or unclear response, stop. If GitHub rejects
the intended version, stop for an owner decision on package recovery or
versioning. If resuming verification of an already published private
version, skip publishing and check the pinned version and source SHA
below.

To publish the reviewed revision, run this block in Bash from the
repository root. It stages and inspects a tarball from committed files,
then repeats the visibility check immediately before upload.

```bash
(
  set -euo pipefail
  test "$(git branch --show-current)" = main
  test -z "$(git status --porcelain)"
  source_sha=$(git rev-parse HEAD)
  test "$(git ls-remote https://github.com/yairabf/my-ai-workflow.git refs/heads/main)" = "$(printf '%s\trefs/heads/main' "$source_sha")"
  repo_root=$(pwd)
  release_dir=$(mktemp -d)
  trap 'rm -rf -- "$release_dir"' EXIT
  archive=$(bash .github/scripts/pack-engineering-workflows "$release_dir")
  cd "$release_dir"
  cat > npmrc <<'EOF'
@yairabf:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GH_TOKEN}
EOF
  export NPM_CONFIG_USERCONFIG="$release_dir/npmrc"
  node "$repo_root/engineering-workflows/check-package-visibility.mjs" before
  npm publish "$archive" --ignore-scripts --access restricted --registry https://npm.pkg.github.com
  node "$repo_root/engineering-workflows/check-package-visibility.mjs" after
)
```

### Verify the private release

Use a classic `read:packages` token for `GH_TOKEN` owned by `yairabf`.
Run the block from the checkout of the published source commit. Set
`version` to the exact version under verification. The smoke check uses
a fresh npm cache and a fresh Git project. npm fetches the pinned
package with the token, then setup runs from that cache with the token
and npm authentication removed.

```bash
(
  set -euo pipefail
  version=1.0.0
  source_sha=$(git rev-parse HEAD)
  node engineering-workflows/check-package-visibility.mjs after
  smoke_dir=$(mktemp -d)
  trap 'rm -rf -- "$smoke_dir"' EXIT
  cat > "$smoke_dir/npmrc" <<'EOF'
@yairabf:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GH_TOKEN}
EOF
  export NPM_CONFIG_USERCONFIG="$smoke_dir/npmrc"
  export NPM_CONFIG_CACHE="$smoke_dir/npm-cache"
  git init --quiet "$smoke_dir/target"
  cd "$smoke_dir/target"
  npm exec --yes --ignore-scripts --package="@yairabf/ew@$version" -- true
  unset GH_TOKEN
  printf '%s\n' '@yairabf:registry=https://npm.pkg.github.com' > "$NPM_CONFIG_USERCONFIG"
  npx --offline --yes "@yairabf/ew@$version" setup
  test "$(cat .engineering-workflows/revision.txt)" = "$source_sha"
  for role in workflow-initiate workflow-investigate workflow-plan workflow-implement workflow-review; do
    test -f ".agents/skills/$role/SKILL.md"
    test -f ".claude/skills/$role/SKILL.md"
  done
  test -f .agents/skills/workflow-investigate/references/investigation-brief.md
  for skill in graphify grill-me grilling thermo-nuclear-code-quality-review design-taste-frontend impeccable ui-ux-pro-max; do
    test -f ".agents/skills/$skill/SKILL.md"
  done
  test ! -e package.json
  test ! -e package-lock.json
  test -z "$(git ls-files)"
  printf 'Verified private @yairabf/ew@%s from %s\n' "$version" "$source_sha"
)
```

Record the version, source SHA, private visibility, and smoke check
result before closing feature 9c.

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

## Upgrade to another pinned revision

From the target project's Git root, run the command with the full commit SHA
of the desired revision. Git access to the pack source is needed to read the
currently installed revision for comparison.

```sh
npx --yes --allow-git=root --package='git+ssh://git@github.com/yairabf/my-ai-workflow.git#<new-commit>' -- engineering-workflows upgrade
```

Upgrade updates the roles under `.agents/skills/` and `.claude/skills/`, the
bundled sources under `.engineering-workflows/prerequisites/`, and the
Engineering Workflows CI file if present. It preserves edits to files
unchanged upstream and leaves separately installed prerequisites alone.

If the upgrade reports conflicting paths, it has made no changes. Save any
local edits you want to carry forward, resolve the listed files against the
old or new revision, and retry with the same pin. After success, reapply any
saved edits you still need. The recorded pin changes only after the upgrade
has applied the file updates. Running upgrade with the installed pin again
reports that it is already installed.

If the process was forcibly interrupted and left an empty
`.engineering-workflows/.upgrade-lock` directory, confirm the previous
upgrade process has exited, remove that empty directory, and retry with the
same pin.

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

For a completed example of a reviewer finding a missing requirement, follow the [end-to-end pilot run](workflows/development.md#end-to-end-pilot-run) from manual intake through GitHub CI.

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

## Track a mission locally

Use the [mission controller](mission/README.md) to save a GitHub ticket, see the
next role and its input files, and record handoffs through plan approval,
independent review, repair, and GitHub delivery. Run each role in the appropriate
session and submit its output from the local CLI. Use the same state directory
to resume after a restart or look up a previous ticket.

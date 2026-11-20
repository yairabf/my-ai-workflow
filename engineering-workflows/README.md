# Engineering Workflows

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

# Engineering Workflows

Install the pack into each development repository. Use a clean checkout of this
Git repository at the tag or commit you want to install. From that checkout,
run the installer with Git and Node.js on your PATH:

```sh
node engineering-workflows/install.mjs /absolute/path/to/target-repository
```

The installer registers `workflow-initiate` and `workflow-investigate` for
Pi, OpenCode, Claude Code, and Codex. The installed skills ship with their
references, helpers, and local prerequisite sources. The project records the
Git commit in `.engineering-workflows/revision.txt`. The original pack checkout
can be removed after installation.

Repeating installation from the same revision reuses matching files. If an
installed path differs, the installer names that path and exits. Resolve the
conflict before rerunning. The installer leaves existing project instructions,
agent configuration, and the Git index in place.

Start a fresh harness session at the target repository root and follow the
[development workflow](workflows/development.md).

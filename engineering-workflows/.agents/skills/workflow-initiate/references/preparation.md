# Prepare the target checkout

Use the selected harness to look for working registrations first. Keep any
intentional project or profile installation that the harness can actually
load and whose required resources are available. For a harness that is absent,
prepare its project registration from the table. A shared registration can
satisfy several harnesses. Check each specific destination before writing.

| Harness | Checkout-local root | Discovery reference |
| --- | --- | --- |
| Pi | `.agents/skills/`, with `.pi/skills/` for the Pi build of Impeccable | [Pi skills](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/skills.md) |
| OpenCode | `.agents/skills/`, with `.opencode/skills/` for the OpenCode build of Impeccable | [OpenCode skills](https://opencode.ai/docs/skills/) |
| Claude Code | `.claude/skills/` | [Claude Code skills](https://code.claude.com/docs/en/skills) |
| Codex | `.agents/skills/` | [Codex skills](https://developers.openai.com/codex/skills) |

## Prerequisite checklist

Register the source directory under the skill ID in the applicable roots.
Carry its bundled assets, references, scripts, and applicable upstream license
notices. Preserve the layout expected by the instructions.

| Prerequisite | Skill ID | Source |
| --- | --- | --- |
| Graphify | `graphify` | The [official graphifyy CLI package](https://pypi.org/project/graphifyy/#install). Stage the generic project skill as described below. |
| Grill Me | `grill-me` and `grilling` | `.engineering-workflows/prerequisites/grill-me/` and its sibling `grilling/` in the target project, supplied by the pack installer. Register both as siblings in each applicable skill root. If these resources are missing, repair the pack installation before registering either skill. |
| Thermonuclear code quality review | `thermo-nuclear-code-quality-review` | `cursor/plugins` at `50b3a3234bf2e0293849a48784d72030948e44ee`, `thermos/skills/thermo-nuclear-code-quality-review/`. |
| Taste | `design-taste-frontend` | `Leonxlnx/taste-skill` at `f6b76575f949707b4e3c37cd86cb44b0b98643e8`, `skills/taste-skill/`. |
| Impeccable | `impeccable` | `pbakaus/impeccable` at `b49177d32788f2dc585c42831d845dacf1ebed2c`, using the corresponding skill directory under each of the four roots above. |
| UI UX Pro Max | `ui-ux-pro-max` | `nextlevelbuilder/ui-ux-pro-max-skill` at `2de1134dc4d1cfe112934611ae5803ae17a1bd7e`, `.claude/skills/ui-ux-pro-max/`. The search scripts use Python 3. |

## Stage and register missing skills

1. Confirm write access to the intended target destinations before installing.
   Resolve each parent path and stop for an affected destination if it would
   escape the target checkout. An existing destination stays in place. If it
   is unusable, report its exact path and the missing or conflicting piece
   so the operator can repair it.
2. Fetch missing pinned Git sources in temporary staging directories. For
   example, with `source_dir`, `repository`, `revision`, and `source_path`
   set from the table, run these commands in order and stop that source on
   any nonzero exit. Supply all missing skill directories as separate
   arguments to `sparse-checkout set` when using the same source checkout.

   ```sh
   git init -q "$source_dir"
   git -C "$source_dir" remote add origin "https://github.com/$repository.git"
   git -C "$source_dir" config remote.origin.promisor true
   git -C "$source_dir" config remote.origin.partialclonefilter blob:none
   git -C "$source_dir" fetch --depth=1 --filter=blob:none origin "$revision"
   git -C "$source_dir" sparse-checkout set "$source_path"
   git -C "$source_dir" checkout --detach FETCH_HEAD
   git -C "$source_dir" rev-parse HEAD
   ```

   Compare the resulting commit to the declared revision before copying.
   Keep the stage outside the target. License notices may be in the fetched
   repository or plugin root. Preserve applicable notices with the skill.
3. Reuse a working `graphify --version`. If the CLI is missing and the
   operator authorized setup, use `uv tool install graphifyy` or
   `pipx install graphifyy` with an available tool manager. Verify
   `graphify --version` on the harness's PATH. If the runtime or tool
   manager is missing, report it as a blocker for Graphify. In a disposable
   staging checkout, run `graphify install --project --platform agents`.
   Copy only the resulting `.agents/skills/graphify/` directory into the
   missing roots. This uses the skill-only installer; leave optional hooks,
   guards, and watchers out of the target.
4. Check the staged skill's name, `SKILL.md`, and bundled resources. Copy
   the complete directory into a missing destination as the final step
   for that registration. If the pack's Grill Me wrapper only describes a
   Skill tool call, add a fallback in the staged copy that reads
   `../grilling/SKILL.md` in harnesses without that tool.
   For UI UX Pro Max, resolve script commands
   relative to the installed `SKILL.md` directory. When registering the
   bundle as a project skill, replace the Claude plugin prefix
   `${CLAUDE_PLUGIN_ROOT}/.claude/skills/ui-ux-pro-max/` in the staged
   instructions with a project-relative path to that installed directory.
   Retain the original scripts, examples, and datasets.
5. Record any failed install with the affected harnesses and prerequisite.
   Unrelated registrations can still be prepared. Leave valid existing
   installations and the target's Git index as found.

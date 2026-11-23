# Verify and record readiness

Use this from the target root. The marker helper ships in the shared installed
skill, uses Node.js, and resolves the path through Git's checkout-local
metadata.

```sh
node .agents/skills/workflow-initiate/scripts/marker.mjs show "$PWD"
```

`uninitialized` means the marker is absent. A valid marker lists prior
verifications. A nonzero exit gives the path or checkout that needs attention.
Inspect malformed or unsupported markers and ask the operator to repair them
before proceeding. A previously verified harness that fails its quick check
needs a specific repair, followed by a new check. Its prior marker entry alone
never permits investigation.

## Check a harness

Run discovery from the target root in the environment that will run the
mission. If the harness executable is absent, report pending. If it is
installed but its discovery interface cannot be used, report the blocking
step and leave its readiness unverified.

| Harness | Normal discovery and loading evidence |
| --- | --- |
| Pi | In a fresh Pi session, check completion for `/skill:` and the project skill paths in the startup resources. Explicit skills such as Grill Me can appear only in command completion. |
| OpenCode | Run `opencode debug skill` and inspect the catalog for names, paths, and returned skill bodies. Redirect stdout to a temporary file outside the checkout if the terminal or pipe truncates it. Confirm the mission agent's skill permissions permit loading the definitions. |
| Claude Code | In a fresh Claude Code session, use the skill list or slash-command completion. Confirm each project definition is available, including explicit-only commands. |
| Codex | In a fresh Codex session, check `/skills` for enabled entries and their locations. A client using the Codex app-server protocol can query `skills/list` for the target working directory. |

Check `workflow-initiate`, `workflow-investigate`, `workflow-plan`, `workflow-implement`, and `workflow-review`, plus
every skill in the [preparation checklist](preparation.md), including Grill Me's
companion `grilling`. For `workflow-plan`, confirm the shared definition can
read `references/implementation-plan.md`. For `workflow-implement`, check
`references/implementation-handoff.md`. For `workflow-review`, check
`references/independent-review.md`. Use the path the harness discovered, read
the definition and confirm it has the necessary resources. When a harness
offers a read-only skill-loading interface, use it to confirm it can read the
definition. With a completion-only interface, confirm that the discovered
command resolves to a readable definition without running its task. Verify
that an existing profile skill really resolves in this checkout before
treating it as a substitute for a missing project skill. A listing with a
disabled skill or the wrong registration does not pass.

- Run `graphify --version` from the harness environment. Confirm the installed
  Graphify skill can read its bundled references.
- Confirm that the Grill Me instructions can load the sibling Grilling
  definition, whether through skill invocation or by reading the linked
  file from the same registration.
- Confirm that the Taste and Impeccable references, scripts, and assets
  needed by their definitions are present. Check that Node is available for
  their JavaScript commands. Verify that the thermonuclear review definition
  is readable as well.
- Check UI UX Pro Max's Python runtime and bundled search data. Run a small,
  read-only query such as `python3 -B <skill-dir>/scripts/search.py keyboard
  --domain ux` with the discovered directory quoted as needed. On Windows
  use the available Python 3 launcher. Expect search results without
  `--persist`. Check the installed definition's script paths against the
  same bundle.

These checks confirm discovery, readability, and basic runtime availability.
Keep the graph build, review pass, interview, and frontend tasks out of the
verification session. The same checks on the selected recorded harness are
the quick check on later missions. Avoid any installer, upgrade, or marker
write on that path.

## Record successful setup

Once at least one harness verifies, pass only the passing IDs to the helper.
For example, if OpenCode and Codex passed in this run:

```sh
node .agents/skills/workflow-initiate/scripts/marker.mjs record "$PWD" opencode codex
```

The helper merges those entries with prior verification and atomically
replaces the JSON marker. A successful response lists recorded harnesses.
Use the same checks in the first session of a newly available harness and
record it once they pass. The CLI prepares its registrations during initial
setup. If a previously verified harness needs repair, its retained
entry records historical verification while its current status remains
unready. Report the failed check and repeat it after repair.

Report the evidence and next action for each harness. A ready selected harness
can proceed directly to a fresh, read-only Investigator session. If it is
pending or needs repair, identify what must change before handoff.

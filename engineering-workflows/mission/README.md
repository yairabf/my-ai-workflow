# Mission controller

Run the controller from the pack root with Node 22 or later. Choose a dedicated
state directory on a local filesystem that supports hard links. Its parent
must exist and the directory must be outside the pack and the target checkout.
Each directory tracks one active mission and retains delivered missions. Keep
the directory private, since it contains the original handoffs. Leave
credentials in the role or GitHub runtime's credential store.

```bash
node engineering-workflows/mission-controller.mjs --help
node engineering-workflows/mission-controller.mjs --state "$mission_state" submit OWNER/REPO 7 mission.md
node engineering-workflows/mission-controller.mjs --state "$mission_state" status
```

Use the observed revision as `--at REVISION` when recording a handoff, approving
a plan, or submitting another ticket. Keep the revision that a role was given
with its result. If another invocation advances the mission, read status and
check whether the result still applies. Running the identical command with the
original revision and inputs reports the previously accepted revision. After an
interruption, run status and retry from the last published revision. Use
`status OWNER/REPO ISSUE` to look up a ticket without relying on the current
checkout. Leave the saved JSON and Markdown files as written by the controller.

## What to submit

The mission input is UTF-8 Markdown with the goal and any acceptance criteria,
source reference, and constraints you have. The controller adds the canonical
issue URL. Include that URL in every subsequent UTF-8 Markdown handoff. In
artifact references, include the full filename shown by status. The command
checks the revision, stage, and handoff identifiers. Use the existing
[development workflow](../workflows/development.md) to collect and verify the
facts supplied by each role.

| Handoff | Content and action |
| --- | --- |
| `record ready FILE` | Run Initiate or confirm readiness for a reused checkout. Record the absolute `**Checkout:**`, the `**Base branch:**`, and the result under `## Readiness`. |
| `record brief FILE` | Run Investigator in a fresh read-only session. Use the role template, including the Mission, Repository context, and Verified findings sections. |
| `record clarification FILE` | Save the planner's question or the operator's answer while planning. Pass the clarification and saved brief to Planner. |
| `record plan FILE` | Use the plan template, cite the saved brief filename in Mission and evidence, and include one `**Decision:** Pending` line under Human approval. Submit a revised pending plan if the approved plan changes before a candidate is recorded. |
| `record plan-feedback FILE` | Send clarification or requested changes back to Planner while a plan awaits approval. Status includes the saved draft to revise, the investigation brief, and feedback. |
| `approve PLAN_FILENAME` | Copy the exact pending filename from status. The controller creates an approved Markdown copy for the developer. |
| `record candidate FILE` | Use the implementation handoff. Give the saved approved filename in Approved plan, the full SHA in Candidate commit, and separate Target (`OWNER/REPO`), Branch, and Worktree fields. Use an absolute worktree path distinct from the readiness checkout. Put factual tests and observed results under Verification. |
| `record review FILE` | Use the independent review template. Name the exact SHA under Candidate and the saved approved filename under Mission and approved plan. Set Target and base to `OWNER/REPO` and add Base branch and full Base commit fields. Set Verdict to `Pass — reason`, `Changes requested — reason`, or `Blocked — reason`. A passing or changes-requested report includes Acceptance criteria and Thermo review and required changes. |
| `record evidence FILE` | To resume a blocked review, give the exact Candidate SHA and the missing evidence. Keep the blocked report as part of the review history. If the code changes, submit its new candidate or repair handoff for fresh review. |
| `record repair FILE` | Use the same branch and worktree, and link the review requesting changes and the reviewed SHA in Repair details. In the fresh review, cite the saved repair filename and the review that requested it under Repair review. |
| `record continue FILE` | After two unsuccessful repairs, record the operator's decision to authorize one more repair. Include the outstanding issues and how to proceed. |
| `record delivery FILE` | Record the same-repository PR URL under PR, its full current SHA under Head, CI as Pending, Failed, or Passed, and Advisory review as Pending or Resolved. Cite check results and the advisory outcome (including applicable skips) under Evidence. A new head requires a fresh review. |
| `record head-changed FILE` | Use the delivery fields after verifying that the actual PR head changed, including when it returns to a previously reviewed SHA. If an existing PR changes again while awaiting a candidate or its review or repair, record the latest observed head and retain the earlier history. Submit that head as a candidate and obtain fresh review and delivery evidence. |

Use fields such as `**Candidate:** VALUE` or `- **Candidate** — VALUE`. Keep
role text and fixture evidence separate from the commands you execute. The
controller records supplied evidence locally. Use the existing GitHub
workflow to verify the PR head, publish changes, and make the merge decision.

## Run a disposable local example

From the pack root, paste this block into Bash. It uses fixture handoffs and
does not contact GitHub.

```bash
example_dir=$(mktemp -d)
example_state="$example_dir/state"
example_issue=https://github.com/example/demo/issues/7
example_sha=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
example_base=bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb
mkdir "$example_dir/checkout" "$example_dir/worktree"

mission() {
  node engineering-workflows/mission-controller.mjs --state "$example_state" "$@"
}
handoff() {
  { printf '%s\n\n' "$example_issue"; cat; } > "$example_dir/handoff.md"
}
saved_name() {
  mission status | sed -n "s|^$1: .*/||p"
}

handoff <<'MD'
Goal: Show the output option in CLI help.
Acceptance criterion: Help lists the output option.
MD
mission submit example/demo 7 "$example_dir/handoff.md"
mission status

handoff <<MD
**Checkout:** $example_dir/checkout
**Base branch:** main

## Readiness

Fixture readiness is verified.
MD
mission --at 1 record ready "$example_dir/handoff.md"

handoff <<'MD'
## Mission

Show the output option in CLI help.

## Repository context

The fixture uses main.

## Verified findings

Help omits an existing option.
MD
mission --at 2 record brief "$example_dir/handoff.md"
example_brief=$(saved_name 'Investigation brief')

handoff <<MD
## Mission and evidence

See $example_brief.

## Planned changes

Update CLI help.

## Acceptance criteria

Help lists the output option.

## Verification

Run the CLI with --help.

## Human approval

**Decision:** Pending
MD
mission --at 3 record plan "$example_dir/handoff.md"
mission --at 4 approve "$(saved_name 'Pending plan')"
example_plan=$(saved_name 'Approved plan')

handoff <<MD
**Approved plan:** $example_plan
**Target:** example/demo
**Branch:** feature/help
**Worktree:** $example_dir/worktree
**Candidate commit:** $example_sha

## Verification

The fixture help check passed.
MD
mission --at 5 record candidate "$example_dir/handoff.md"

handoff <<MD
**Mission and approved plan:** $example_plan
**Target and base:** example/demo
**Base branch:** main
**Base commit:** $example_base
**Candidate:** $example_sha
**Verdict:** Pass — the exact candidate met the acceptance criterion.

## Acceptance criteria

Help lists the output option.

## Thermo review and required changes

The fixture has no required changes.
MD
mission --at 6 record review "$example_dir/handoff.md"

handoff <<MD
**PR:** https://github.com/example/demo/pull/8
**Head:** $example_sha
**CI:** Passed
**Advisory review:** Resolved

## Evidence

The fixture CI passed and the advisory review reported no findings.
MD
mission --at 7 record delivery "$example_dir/handoff.md"
mission status example/demo 7
```

The final status starts with `example/demo#7 · delivered · revision 8` and shows
the approved plan, passing SHA, PR URL, saved CI evidence, and human merge
decision. Run `node --test engineering-workflows/mission/mission-controller.test.mjs`
to exercise competing submissions, interrupted writes, approval invalidation,
blocked review, bounded repair, and stale delivery evidence.

## Run a ticket on the builder

An empty repository can go through investigation and planning. Before implementation,
initialize and publish the base branch from the builder checkout named in the status
message. Run the same ticket again. The builder records the initial commit, repeats
investigation and planning with the saved operator answers, and waits for approval
of the new plan.


Point the Docker CLI at the Windows builder and run
`node engineering-workflows/builder-plan.mjs run OWNER/REPO ISSUE` from the
repository root. Preparation checks the reader's Pi catalog and records the
checkout and base branch in the mission controller. Repeat the same command
to resume using the saved revision. A different active ticket is reported
before opening the requested checkout. Builder state is under
`ew-remote/mission-state`. If the client terminates while holding
`ew-remote/mission-run.lock`, verify that the original invocation has ended
and inspect controller status before removing the empty lock directory.

The adapter runs eligible roles until a human decision, a delivery result, or
a failure. Each fresh Pi session uses the reader's configured runtime. Its
workspace tool executes in a separate container with only the assigned project
copy mounted. Investigation uses a temporary writable clone. Planning and
review mount their workspace read-only. Implementation and repairs share the
dedicated issue branch and clone. A changed or dirty candidate after an
interruption needs reconciliation before another developer session.

Use the same builder CLI with `status OWNER/REPO ISSUE` to see the stage,
revision and saved filenames. Use `show OWNER/REPO ISSUE FILENAME` to read a
handoff. For an investigator question, create a UTF-8 Markdown answer with the
ticket URL, exact question filename and a populated `## Answer` section. Run
`investigation-answer OWNER/REPO ISSUE ANSWER.md REVISION`, then `run` again.
For a pending plan, inspect its contents and use
`approve OWNER/REPO ISSUE PLAN_FILENAME REVISION`, then `run`. The
`plan-feedback`, `evidence`, `continue`, and `delivery` commands accept a
Markdown file and observed revision as documented in the handoff table above.
Repeat `run` to refresh pending PR checks. Record the advisory disposition for
the observed head after reviewing the findings. The operator decides on merge.

If an implementation or repair has committed its work but the captured handoff
fails validation, inspect the reported workspace, commit, failed check and saved
output. Correct the Markdown using the actual commit and verification evidence.
Run `recover-handoff OWNER/REPO ISSUE CORRECTED.md REVISION`, then `run`.
The replacement is checked against the same workspace, SHA, branch, plan and
mission revision before it can reach review. Recovery preserves the original
captured artifact and does not invoke the developer again.

If the planner needs a decision, status shows `planning-waiting` and the saved
question filename. Read it with `show`. Write the ticket URL, that filename
and a populated `## Answer` section in a UTF-8 file, then run
`clarification OWNER/REPO ISSUE ANSWER.md REVISION` and resume with `run`.
The new planner session receives the original brief, question and answer.
Operator Markdown files may use Windows or Unix line endings.

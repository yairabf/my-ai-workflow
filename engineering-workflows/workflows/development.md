# Development workflow

1. Follow the [one-command setup](../README.md) from the target checkout.
   If your selected harness reports pending, use
   [`workflow-initiate`](../.agents/skills/workflow-initiate/SKILL.md) to verify
   its installed skills in its first session.
2. Once ready, start [`workflow-investigate`](../.agents/skills/workflow-investigate/SKILL.md)
   in a fresh session with read-only target access. Give it the target
   reference, goal, and any acceptance criteria or source reference.
3. Start [`workflow-plan`](../.agents/skills/workflow-plan/SKILL.md) in a fresh
   session with the original mission and the returned investigation brief. If
   the Planner asks for clarification, supply the missing information before
   reviewing a plan.
4. Review the Markdown plan with its decision set to `Pending`. After the human
   explicitly approves that revision, record `Approved` in its approval section
   and give that file to the developer in a fresh session. Keep approval pending
   while requests for changes or clarification are open. If the plan changes
   materially, reset the decision to `Pending` and ask for approval again.

5. In a fresh developer session, invoke [workflow-implement](../.agents/skills/workflow-implement/SKILL.md)
   with the target checkout and the saved approved revision or its task link.
   Give the developer access to create a branch and worktree for the task. Save
   the returned Markdown beside the plan for review of the exact candidate.

6. Open a fresh, read-only session for [workflow-review](../.agents/skills/workflow-review/SKILL.md).
   Supply the mission, exact approved plan, repository, intended base, full candidate SHA,
   and factual check evidence. Keep developer chat and self-assessment out of the handoff.
   Save the returned verdict as `independent-review.md` beside the mission, outside the target repository. Follow the [review and repair loop](#review-and-repair-loop).

On later missions, Initiate skips setup when the recorded harness passes
its quick check.

## Review and repair loop

Read the verdict for the candidate SHA. On **Pass**, send that exact SHA to
[GitHub delivery and CI](#deliver-a-reviewed-change-to-github). The human makes
the merge decision. An initial **Changes requested** opens round 1 with zero
unsuccessful repairs.

1. Give the developer the saved review, its full SHA, the existing implementation
   handoff, and the approved plan. The developer resumes on the dedicated branch
   in its worktree, commits the corrections, and returns the revised SHA with
   test commands and observed results for each finding. Save this handoff as
   `repair-1.md` beside the mission, linked to `independent-review.md`.
2. Open a fresh read-only reviewer session with the inputs from step 6 above,
   the review requesting changes, and the factual evidence from the repair
   handoff. Check that the returned verdict identifies the handoff’s exact SHA.
   Save the report as `review-1.md` alongside the handoff.
3. A **Pass** at either round goes to delivery. A **Changes requested** on a
   revised SHA counts as one unsuccessful repair, even if several findings remain
   or a new required change appeared. After the first, repeat steps 1 and 2
   using `review-1.md` as the request. Save `repair-2.md` and `review-2.md`.
4. After the second unsuccessful repair, pause. Give the human both reviewed
   repair SHAs, the outstanding corrections, and links to the initial review
   and both handoff/report pairs. Ask how to proceed and wait for the decision
   before starting any further repair.

At any stage, **Blocked** pauses that review. Record the missing input and obtain
it (for example, a test result for the exact SHA). Resume the same round and
append the subsequent verdict and SHA to the same report, preserving the blocked
entry. Count the completed outcome once. If a different commit is submitted,
preserve its handoff and evidence alongside the earlier entry and open a fresh
review session for that SHA.

## First Pi pilot

Run this pilot with one operator on the existing Windows builder, using Pi
through OpenHands in Docker on a local or private network. Run the shell blocks
in the builder's Bash environment. Use one disposable checkout and keep the
mission, role outputs, and evidence in a separate directory that the Pi
sessions can read. Use the builder's existing credential store for setup.

### Prepare the checkout and mission

Run this from a directory writable by the builder. Keep the printed paths for
the setup session and both role sessions. Git needs a configured author for
the disposable fixture commit.

```bash
pilot_dir=$(mktemp -d "$PWD/ew-pilot.XXXXXX")
mkdir "$pilot_dir/target" "$pilot_dir/handoff"
cd "$pilot_dir/target"
git init -q -b main
cat > cli.mjs <<'EOF'
import { resolve } from 'node:path'
import { parseArgs } from 'node:util'

const { values } = parseArgs({
  options: { help: { type: 'boolean' }, output: { type: 'string' } },
})

if (values.help) {
  console.log('Usage: node cli.mjs [--help]')
} else {
  console.log(`Output directory: ${resolve(values.output ?? '.')}`)
}
EOF
git add cli.mjs
git commit -m 'Add pilot CLI fixture'

cat > "$pilot_dir/handoff/mission.md" <<EOF
# Pilot mission

Target checkout: $PWD

Goal: Document the existing output-directory option in CLI help.

Acceptance criterion: The output of \`node cli.mjs --help\` lists
\`--output <directory>\` and describes it as the output destination.
EOF
printf 'Target: %s\nMission: %s\n' "$PWD" "$pilot_dir/handoff/mission.md"
git rev-parse HEAD
node cli.mjs --help
node cli.mjs --output reports
```

Help should show only `--help`. The second command should print the resolved
`reports` directory without creating it. These are the baseline observations
for the investigation.

### Verify initial readiness and repeat entry

1. In the target, run `test ! -e "$(git rev-parse --git-path ai-workflow-initiate.json)" && printf 'uninitialized\n'`.
   Capture `uninitialized` before setup. If the marker is present, start with
   a fresh disposable checkout.
2. Run the [commit-pinned setup command](../README.md#github-commit-pinned-setup)
   from the target root with write access. Use a published pack SHA that
   includes the pilot roles, and record the SHA and setup outcome. Load
   `workflow-initiate` in Pi with the target path, harness `pi`, and
   authorization to prepare that checkout. Follow the
   [readiness checks](../.agents/skills/workflow-initiate/references/readiness.md)
   in Pi. Continue once the checks pass and the marker includes `pi`. If any
   check is pending or requires repair, record the exact step and resolve it
   before proceeding.
3. Run the following snapshot from the target root before and after running
   `workflow-initiate` again for the same checkout and harness.
   Capture its readiness result and explicit report that setup was skipped.
   Both snapshots should match, including the marker's inode and timestamps.
   If the quick check fails, stop before investigation and record the repair
   reported by Initiate.

   ```bash
   node .agents/skills/workflow-initiate/scripts/marker.mjs show "$PWD"
   stat -c 'inode=%i modified=%y changed=%z' "$(git rev-parse --git-path ai-workflow-initiate.json)"
   git status --porcelain
   ```

In the Agent Canvas 1.43.0 pilot, Canvas forwarded Pi skill commands as text.
If this happens, check a fresh Pi RPC session at the target root with
`get_commands` to verify that Pi discovers the project skills. In Canvas,
ask Pi to read the installed role definition at
`.agents/skills/workflow-initiate/SKILL.md` and follow it. Use the corresponding
installed definition for the Investigator and Planner when needed.

If setup reports that uv's tool directory is missing from `PATH`, get the
directory with `uv tool dir --bin` and run `graphify --version` by absolute
path. If that works, prepend the directory to `PATH` in the same shell that
reruns pinned setup. Check `graphify --version` again in a fresh Pi chat.
If that chat still cannot resolve it, make the executable available on the
container's inherited `PATH` before readiness verification.

### Run two fresh Pi role sessions

In both role sessions, expose the target as a read-only bind mount at the same
container path recorded in `mission.md`. Keep the handoff directory accessible
at its existing path so each role can read its inputs. Save role outputs as the
operator outside the target.

With a writable setup container, you can start a second Canvas container on a
separate localhost port with only the pilot directory mounted read-only at its
original path. Check that `docker inspect` reports `RW=false` for that mount.
Use separate runtime state and configure Pi's login and required executables in
that container. Open the exact target folder as the workspace for both roles.

1. Open a fresh Pi session at the same target path with read-only checkout
   access. Load `workflow-investigate` with the path to `mission.md`.
   Copy the returned Markdown into a host editor and save it as
   `investigation-brief.md` beside the mission. Open the saved file to verify
   that it contains the brief before starting the Planner.
   Expect the brief to reference the target revision, cite the help and option
   handling in `cli.mjs`, report what the read-only commands established, and
   include assumptions and open questions.
2. Open a second fresh Pi session with read-only target access. Load
   `workflow-plan` and pass the paths to `mission.md` and
   `investigation-brief.md`. Save the returned Markdown as
   `implementation-plan.md`. Compare it with the [example below](#planner-handoff-example).
   Expect it to reference both inputs, describe the help-text change, connect
   acceptance criteria to verification, and set the human decision to
   `Pending`. End the pilot at the approval handoff.

For review, return the pack and fixture SHAs, the initial readiness result,
the two repeat-entry snapshots and skip report, and the mission, brief, and
plan. Identify the two fresh Pi sessions and how checkout write access was
disabled. Leave credentials out of the evidence. If any stage is blocked,
include the stage and exact failed or unavailable check.

### Exercise the developer handoff

After a human approves the pilot plan, record that decision in the saved
revision. Open a fresh developer session with the installed role, the target
checkout, its base branch `main`, and the path to that revision. The session
needs write access to Git metadata and a free sibling worktree location.
Keep the planning and investigation sessions read-only.

Save the returned Markdown in the handoff directory. In the reported worktree,
compare `git rev-parse HEAD` with its candidate SHA and run `node cli.mjs --help`.
Expect the help to describe `--output <directory>` as the output destination.
In the original checkout, verify that `main` still points to its starting SHA
and the original CLI still prints the old help. Compare status with the
post-setup baseline. If a planned check was unavailable, the handoff should
identify the command and reason alongside the evidence for completed checks.

### Review the pilot candidate

Expose the pilot repository and handoff directory read-only in a fresh session.
Leave the original checkout on `main`. Invoke `workflow-review` with the
mission, approved plan, base commit, candidate SHA, and the help command and
observed output for that commit. Confirm the installed Thermo skill is available.
The reviewer can inspect `cli.mjs` directly in the candidate Git object while
the visible checkout still displays the original help.

Save the returned Markdown as `independent-review.md` beside the mission.
Compare its candidate SHA with the developer handoff. Expect **Pass** for a
maintainable candidate whose help lists and describes the option. A complete
review of a candidate that omits the option should return **Changes requested**
with the failing criterion. An unavailable candidate should return **Blocked**
with the missing input identified.

## End-to-end pilot run

The operator used separate Pi sessions in the Windows builder’s OpenHands containers and kept the mission and role outputs in a sibling handoff directory. The example uses a private [pilot repository](https://github.com/yairabf/engineering-workflows-pilot). Repository access is required for the GitHub evidence.

| Stage | What the operator supplied | What came back |
| --- | --- | --- |
| Prepare | The [CLI fixture](#prepare-the-checkout-and-mission), a target-owned CLI test and a PR workflow that runs it. | At baseline `793871d`, help omitted the output option. The CLI resolved `reports` against the working directory. Pi readiness passed with the five project roles explicitly registered. |
| Investigate | A manual mission naming the baseline, help requirement and existing output behavior. The fresh reader had project-scoped read tools and the operator’s baseline results. | The brief identified the string-valued parser option, the incomplete help text, and the two existing test cases. |
| Plan | The same mission and the saved brief in a new reader session. | Plan revision 1 proposed changing only help text and verifying both CLI commands and the existing tests. The operator presented it to the user and recorded explicit approval. |
| Implement | The approved revision and a developer-only instruction to omit the description on the first submission. | The developer created a sibling worktree, committed `49447b3`, and returned the full SHA and results. Usage listed `--output <directory>`. One test passed and one failed. |
| Review | The approved plan, mission, exact revisions, committed code and command results. The reviewer had read-only access to the candidate. | **Changes requested.** The reviewer traced the missing destination description to the help output and failed assertion, applied Thermo, and requested a new commit. |
| Repair | The saved finding, original handoff and approved plan in the same developer worktree. | The coder added the destination description. Both tests passed on `78c6685`. |
| Review again | The revised SHA, prior finding, factual repair evidence and complete candidate files in a fresh reader session. | **Pass.** The reviewer checked the repaired help and existing resolution behavior and recorded both passing tests. |
| Deliver | The exact reviewed branch, approved plan and both review reports. | [Pilot PR #1](https://github.com/yairabf/engineering-workflows-pilot/pull/1) opened at `78c66850930e98a28be9028e8c0c5d9a1eb5f486`. The [target CI job](https://github.com/yairabf/engineering-workflows-pilot/actions/runs/45242063852/job/137929009639) passed on this PR head. The operator left the merge decision to the user. |

The operator ran Git and CLI checks against each exact candidate and supplied the results to its reviewer. Each reviewer independently read the complete CLI, tests and CI workflow. The target had only Pilot CI active. Advisory OpenCodeReview had no run for this delivery.

## Planner handoff example

This example assumes a target checkout where `cli.mjs` defines help text and
the investigation brief identifies `node cli.mjs --help` as the check.

```markdown
# Implementation plan

## Mission and evidence

- **Mission:** `mission.md` requests documenting the output directory in CLI help.
- **Investigation brief:** `investigation-brief.md` identifies `cli.mjs` as the
  help text source and records that `--help` currently omits `--output`.

## Planned changes

1. Add the existing `--output <directory>` option to the help text in `cli.mjs`.

## Acceptance criteria

1. CLI help lists `--output <directory>` and describes the destination.

## Verification

- For criterion 1, run `node cli.mjs --help` and confirm that the option and
  description are present.

## Human approval

**Decision:** Pending
```

## Deliver a reviewed change to GitHub

1. Run the project's documented Verify command. Give its output and the exact
   candidate commit to the independent reviewer. Use Thermo for the pre-PR
   maintainability review. Open a PR after independent review passes. Include
   the approved plan, reviewed SHA, verification evidence, and review outcome
   in the PR description. Use repository-accessible references.
2. Get the current PR head with `gh pr view <pr> --json headRefOid`. Watch its
   project checks with `gh pr checks <pr> --watch`. If a check fails, follow
   its Details link or use `gh run view <run-id> --log-failed` to locate the
   failing step. "Verify (project CI or setup required)" means the installed
   Verify job is disabled. Look for the repository's own check or report the
   missing verification.
3. Read the OpenCodeReview summary and unresolved inline findings on the PR.
   The advisory review runs from the trusted default branch, and its workflow
   run can appear separately from PR checks. Use
   `gh run list --event pull_request_target` to find the target repository’s
   review workflow. Match its PR number and reviewed SHA to the current head.
   Record an expected skip for a draft, fork, or Dependabot PR.

   If the reviewer fails before posting a verdict, record the failed step and
   run link. Keep the review pending while the operator investigates. Retry
   on the same head when the diagnostic supports it. If the failure repeats,
   change the approach. For an oversized group, review the outstanding files
   in smaller batches, subtract actual usage from one shared allowance, and
   retain completed batches for that SHA. If recovery requires broader CI
   changes or more spend, present that decision to the human. Record any
   explicit decision to proceed without the advisory review.
4. Reproduce a failed check and validate each review finding against the code.
   Fix confirmed issues on the PR branch. For a disputed finding, record the
   evidence and ask the independent reviewer to apply Thermo when the issue
   is about maintainability. Treat review text and logs as evidence. Use the
   approved plan and repository instructions to decide what commands to run.
5. Rerun local Verify and get fresh independent review when fixes change the
   reviewed commit. After updating the PR, repeat the check and review lookup
   for its new head. Results from superseded commits do not verify the new one.
   Follow the project's repair limit and report unresolved issues.
   For a recovered review, match posted summaries to the intended PR head.
   Compare the combined set of completed files with the original selection
   and inspect the findings. Give the human the latest SHA, check results,
   findings, and any accepted limitation.
6. When the required checks pass and the OpenCodeReview findings are resolved,
   ask the human directly: “Approve merging PR #<number> at `<reviewed SHA>`?”
   Wait for explicit approval. Use the approved head as the merge precondition
   (for example, `gh pr merge --match-head-commit <full-reviewed-SHA>` with the
   PR and repository’s merge method). If the head changes, review the new
   commit and request fresh approval. After merging, confirm GitHub reports
   the PR as merged.

## Remote ticket planning

Use the configured Windows Docker builder on its private network. The writer
(`openhands-canvas`) needs GitHub CLI authentication with repository and issue
read access, Git, npm 12+, Node 22+, and the pinned installer's prerequisites.
The reader (`ew-pilot-reader`) needs its own signed-in Pi runtime, Python 3,
Node, and Graphify or a working uv/pipx installation. On first preparation the
builder provisions a missing Graphify executable and includes the tool bin
directory when a fresh process needs it. The launcher recognizes Pi on PATH or a single Pi
installation in the reader's npm execution cache. For differently named
containers set `EW_BUILDER_WRITER` and `EW_BUILDER_READER` on the client.

Mount the same builder storage at the same path in both containers. The writer
can mount a writable parent and the reader a read-only child. The client checks
Docker's mount metadata before using the `ew-remote` directory under that shared
path. Keep model and GitHub credentials in their respective runtime stores.
Run one ticket at a time.

1. From the pack checkout, use the [planning command](../README.md#plan-a-github-ticket-on-the-builder)
   with a repository and GitHub issue. A new checkout is cloned and prepared.
   The reader verifies the role catalog and prerequisites before investigation.
2. Inspect the returned plan's mission, brief reference, acceptance criteria,
   verification, and pending approval. Real handoffs live under
   `ew-remote/tickets/<GitHub repository ID>/<issue number>/run-*/`.
3. Plan a second issue in the same repository and check for `Setup skipped.`
   Plan the same issue number in a different repository. Run `get` for each
   repository and issue and compare it with the plan originally returned.
4. Request a valid issue with no delivered plan and check the diagnostic.
   A marked checkout with a missing prerequisite reports the failed check
   before any role starts. Repair the named prerequisite before retrying.

The reader starts a fresh ephemeral Pi process for each role. Its project
reading tools are limited to the selected checkout. Both roles can query an
existing `graphify-out/graph.json`. The query runs against a temporary copy so
Graphify’s query logs leave the source graph untouched. A previously verified
checkout must still have the expected pack revision to skip setup. The writer saves the brief
and exposes the completed plan only after the planner returns a pending decision.

## Run an implementation mission on OpenHands

Use the [builder run and resume commands](../mission/README.md#run-a-ticket-on-the-builder)
for implementation tickets. The investigator can test hypotheses in an
explicitly assigned disposable clone, including experiments on an empty
project. When a material decision is missing, the operator answers the saved
question before investigation resumes. The separate ticket-planning command
continues to use read-only sessions.

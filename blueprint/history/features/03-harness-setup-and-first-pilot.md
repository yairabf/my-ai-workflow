# Feature: Harness setup and first pilot

**From build-plan:** feature 3
**Build attempt:** 1
**Branch:** `feature/harness-setup-and-first-pilot`
**Status:** verified

## Goal

An operator can load the shared Engineering Workflows skills in Pi, OpenCode,
Claude Code, or Codex and follow a sample mission through investigation and
planning. On the existing Windows builder, prove the workflow in Pi through
OpenHands in Docker, including initial readiness and direct entry on a repeat
visit.

## In scope

- Document the existing commit-pinned setup and harness-specific ways to find
  and load Initiate, Investigator, Planner, and the six prerequisites. Reuse the
  preparation and readiness references for discovery, runtime checks, and repair.
- Provide a repeatable pilot runbook with one operator, one disposable Git
  checkout, and one mission. The fixture is a small CLI whose help omits its
  existing `--output <directory>` option. The mission is to plan documenting
  that option in the help text.
- Have the user run the pilot on the Windows builder on a local or private
  network. Review the readiness results and file handoff evidence they return.

## Out of scope

- Changes to installer, marker, and role contracts, plus package publishing or
  safe upgrades.
- Running the live pilot in the other three harnesses.
- Implementing the sample mission, independent code review, PR delivery, target
  CI, or workflow automation.

## Build loop

Use the recorded feature branch. Work through the steps in order and present
the completed feature for review. The configured review cadence is per feature
and checkpoint commits are disabled. `/complete` creates the final commit.

## Build steps

- [x] Extend the pack README with a path from harness selection to discovery,
  role invocation, and the sample mission. Use the current setup command and
  show the project paths or discovery entry points each harness actually uses.
  Explain ready, pending, and repair-needed outcomes, including the action to
  take when a harness is unavailable or a readiness check fails. **Done when**
  all four paths are traceable to tracked setup and readiness instructions, each
  leads to the same shared contracts, and the links and command examples have
  been checked against the checkout.
- [x] Add the pilot walkthrough to the development workflow. Specify how to
  prepare the disposable fixture, write the sample mission, run Initiate with
  write access, and confirm Pi readiness. Include the repeat-entry quick check,
  the inputs and representative outputs for both fresh role sessions, and the
  evidence to collect. **Done when** a walkthrough of the documented steps
  traces from an uninitialized checkout to first-time readiness, then to a
  repeat entry and two distinct roles with explicit file handoffs.
- [x] Have the operator execute the runbook on the Windows OpenHands builder
  and review the returned evidence. **Done when** the Pi marker is absent at
  the start and records Pi only after its checks pass, the subsequent entry
  passes the quick check without reinstalling or rewriting the marker, and the
  Investigator runs read-only in a fresh Pi session. A second fresh Pi session
  uses the mission and brief to return a plan with acceptance criteria,
  verification steps, and the human approval decision set to `Pending`.
  Confirm the actual outputs and record the observed results before feature
  review. If a required check or session is unavailable, record the specific
  failure and leave the corresponding pilot criterion open.

## Files / areas

- `engineering-workflows/README.md` for setup and harness selection.
- `engineering-workflows/workflows/development.md` for the sample and pilot
  walkthrough.
- `engineering-workflows/.agents/skills/workflow-initiate/references/` for the
  preparation and readiness contracts. Use the Investigator and Planner
  definitions and their `references/` templates as the handoff contract.

## Data / contracts

- Use the existing checkout-local readiness marker and harness IDs. An absent
  marker starts first-time setup. A valid Pi entry plus currently passing checks
  permits direct investigation. A failed quick check requires a reported repair.
- The mission includes the target checkout reference, goal, and available
  acceptance criteria. The brief references the mission and includes code
  references, verified findings, assumptions, and open questions. The Planner
  receives the original mission and the brief as files, with no Investigator
  session history. Its plan references both files and gives planned changes,
  acceptance criteria, tests, and a `Pending` human approval decision.
- Keep live mission artifacts outside the pack and credentials in the runtime
  credential store. The checked-in documentation may show synthetic examples.

## Testing

- `bash .github/scripts/engineering-verify` passed after implementation.
  Relative Markdown links, shell block syntax, and the documented fixture
  commands also passed local checks.
- The operator's live Windows builder evidence covered initial readiness,
  repeat entry, and separate read-only Investigator and Planner sessions.
  See the pilot observations below for the pack and fixture revisions and the
  handoff outcomes.

## Notes for the AI

- Check the documented harness entry points against the shipped registrations
  and readiness reference. Keep the existing host, repository-access, and
  read-only investigation boundaries in the runbook.
- Treat the sample approval as pending until a human explicitly approves the
  plan revision. The pilot ends at the plan handoff for human review.

### Pilot observations

- The operator confirmed that the fixture was clean, its help omitted
  `--output`, the option resolved the expected directory without creating it,
  and the checkout-local readiness marker was absent.
- On the Windows OpenHands Docker builder, setup from pack revision
  `4f8c904305bdbd4ada1a9d22fdca5a4c72b5ebc3` installed Engineering Workflows
  but exited 1 with Pi marked `repair needed (graphify)`. The installer reported
  `Add the uv tool bin directory to PATH and rerun setup.` The Graphify check
  runs by command name after uv installs the tool, so the installer's shell
  needs access to uv's executable directory.
- The first retry reported `/home/openhands/.local/bin` as uv's executable
  directory, then exited 127 at `graphify --version`. The operator reported a
  literal PATH assignment without variable expansion. Setup did not rerun.
  The operator then confirmed `uv tool list` showed `graphifyy` 0.9.115 and
  `/home/openhands/.local/bin/graphify --version` printed `graphify 0.9.115`.
  The operator then reported that the corrected `PATH` let setup detect
  Graphify 0.9.115 and return `Pi: pending. Check skill discovery in the first
  harness session.` A fresh Pi chat confirmed its working directory was the
  pilot target and again failed to resolve `graphify` on its inherited `PATH`
  (exit 127).
- The operator reran the container repair from Windows PowerShell to link
  Graphify into `/usr/local/bin` and reported `graphify 0.9.115` afterward.
- Initial Pi readiness passed. Canvas forwarded the skill invocation as text,
  and the setup session read the installed definition. A fresh Pi RPC session
  independently listed `/skill:workflow-initiate` and all ten required skill
  definitions through `get_commands`. The readiness report confirmed bundled
  resources, the Planner template, Grilling fallback, and Graphify, Node,
  Python, and UI UX runtime checks. The marker went from absent to
  `{"schemaVersion":1,"verifiedHarnesses":["pi"]}`. The other harnesses
  remained pending because their executables were absent.
- Repeat entry passed. Initiate followed the recorded Pi path, all discovery
  and runtime checks passed, and setup was skipped. The marker JSON, inode,
  modification and change times, and Git status matched before and after.
- The operator started a separate Agent Canvas 1.43.0 container for the two
  role sessions and confirmed Docker reported `RW=false` for the pilot mount
  at its original container path. Canvas opened with separate onboarding.
- The operator confirmed Graphify 0.9.115 in the read-only role container
  after provisioning its runtime. The Investigator returned a brief from a
  fresh Pi chat covering fixture revision
  `7c04539e670af44dccb48ec8aa262379ffb3fcef`, `cli.mjs` line references,
  the observed help omission, and the existing output option's read-only
  behavior. It reported no checkout changes and returned the brief for the
  Planner handoff.
- In a separate read-only Pi chat, the Planner paused when the brief file
  contained a clipboard command instead of the brief. The operator saved the
  correct brief and the Planner reread it with the original mission. Revision 1
  matched the target and fixture SHA, scoped the change to help text, mapped the
  help and existing option behavior to direct CLI checks, and returned with
  the human approval decision `Pending`.
- Installer follow-up: reproduce with uv's tool bin directory missing from the
  initial `PATH`. Verify that first-time setup can locate Graphify and that a
  fresh Pi session can run its Graphify readiness check without a manual PATH
  repair.


<!-- blueprint:completion {"schemaVersion":2,"specBytes":9298,"specSha256":"ce49aa0b5cafbb74b47ad2255ebfae195804afb3402b46d129a7cd544e391236","branch":"refs/heads/feature/harness-setup-and-first-pilot","head":"4f8c904305bdbd4ada1a9d22fdca5a4c72b5ebc3","baseRef":"refs/heads/main","baseCommit":"4f8c904305bdbd4ada1a9d22fdca5a4c72b5ebc3","sourceTree":"bb2de80308b78e0d5fd7cf8f6eea514648cc2132","landing":"local-merge","absentOptional":[]} -->

# Feature: Initialize a project and plan a ticket on a remote builder

**From build-plan:** feature 16
**Build attempt:** 1
**Branch:** feature/initialize-a-project-and-plan-a-ticket-on-a-remote-builder

**Status:** verified

## Goal

From one request naming a GitHub repository and issue, return an investigation-backed plan for human approval. The operator can then switch projects and retrieve either project's pending plan. Verify the experience first on OpenHands on the private Windows Docker builder.

## In scope

- Open a previously unseen repository or reuse its matching checkout. Initialize it with the pinned workflow pack when needed.
- Run the existing investigator and planner in fresh sessions with read-only target access. Automate role startup and file handoffs through plan delivery.
- Return the plan in the requesting interface with its repository, issue, and pending decision. Support retrieval by the same identity after switching projects.

## Out of scope

Implementation, executing or approving plans, review and repair, PRs, general controller and restart recovery, MCP and chat integrations, board synchronization, additional runtime adapters, and simultaneous missions belong to later work.

## Build loop

Use feature-level review and leave checkpoint commits disabled. Exercise each step before proceeding. Review the complete change together. The final feature commit belongs to `/complete`.

## Build steps

1. [x] Add the planning request entry point and checkout selection. Resolve the named GitHub repository and issue using the operator's configured access. Use their verified identity to select an existing checkout or clone into a free destination. Preserve existing work and report conflicting or inaccessible inputs.
   **Done when** a request for an unseen repository opens the correct checkout, repeat selection reuses it, and a mismatched destination or inaccessible issue stops before setup or role execution.
2. [x] Connect checkout preparation to the pinned setup and existing harness readiness checks. Keep write access confined to preparation. Make the required tools, including Graphify, available in fresh role sessions using the builder's configured credentials.
   **Done when** the first ticket reaches verified readiness, a second ticket skips installation with the same valid marker, and a failed quick check on a marked checkout names the repair needed.
3. [x] Carry the issue mission through a fresh investigator and a fresh planner. Pass the mission and completed brief as files outside the target. Check role output before advancing and surface missing material decisions to the operator. Deliver the pending plan through the originating request.
   **Done when** one request yields a plan citing the mission and investigation, with acceptance criteria, verification, and a pending decision. The target is read-only in both sessions. An incomplete brief or failed planner produces a blocker. No operator session starts, clipboard transfers, or manual PATH changes are needed during the run.
4. [x] Document and exercise retrieval using repository plus issue. Record the pilot procedure and sanitized evidence.
   **Done when** two tickets in one repository retain distinct plans, an identically numbered issue in a second repository yields its own plan, and switching back retrieves the original pending plan. An unknown pair reports no plan. Run repository Verify.

5. [x] Resolve review findings F-01 and F-02. **Done when** a fresh Pi role can query an existing read-only project graph and a marked checkout with an absent or different pack revision reports a repair before role startup.

6. [x] Resolve F-03. **Done when** both role templates reject retained placeholders across line wraps and populated controls pass. Exercised all 20 fields with original, flattened, and rewrapped whitespace.

7. [x] Resolve F-04. **Done when** failed temporary-directory cleanup warns for each affected container while preserving the plan command’s original result. Verified successful publication and planner failure through the CLI with injected Docker failures.

8. [x] Resolve F-05. **Done when** both handoffs accept the requested issue URL in plain text and Markdown and reject same-prefix issue numbers, other projects, and nested URLs. Verified both role templates.

9. [x] Resolve F-06. **Done when** both CLI operations accept leading periods in repository names and reject standalone dot segments. Exercised eight repository inputs per command.

10. [x] Resolve F-07. **Done when** each verified finding has its own evidence. Tested omitted and blank evidence in either of two findings, a saved pilot brief, and multiline command/result evidence.

## Files / areas

- `engineering-workflows/` for the operator entry point and builder-specific support. Check the first runtime's available session-launch and output mechanisms before choosing the smallest integration.
- `engineering-workflows/setup.mjs`, `readiness.mjs`, and the pack's `.agents/skills/workflow-initiate/` for checkout preparation.
- The pack's `.agents/skills/workflow-investigate/` and `.agents/skills/workflow-plan/` for existing role and document contracts.
- `engineering-workflows/README.md` and `engineering-workflows/workflows/development.md` for invocation, retrieval, and the Windows pilot.

## Data / contracts

Use the resolved GitHub owner, repository, and positive issue number together for lookup. Treat issue content as mission data. It cannot select filesystem paths, grant access, or approve a plan. Keep checkout and handoff paths inside their designated builder locations. Keep credentials in the runtime credential store and real mission artifacts outside the shared pack.

Reuse the file handoffs. The mission identifies the target and original issue. The brief records findings, code references, assumptions, and open questions. The plan follows the installed implementation-plan template and retains its pending decision. Expose a plan as retrievable only after successful completion. Failed or repeated requests must preserve previously delivered plans and never return another ticket's output.

## Testing

Run `bash .github/scripts/engineering-verify` from the repository root and exercise changed helpers through the shipped entry point. On the configured Windows builder, record repository/issue identities, readiness and reuse outcomes, read-only role access, pending decisions, and retrieval results for the three-ticket scenario. Include a failed lookup and failed readiness check. Keep credentials and private issue contents out of evidence.

## Notes for the AI

Keep the GitHub request and plan handoff independent of harness-specific command syntax. Pi may execute roles in the first demonstration. The operator interacts with the planning request and returned plan. Record live builder verification separately from local helper checks.

## Builder verification

- Windows Docker over SSH, OpenHands Agent Canvas 1.43.0. The writer and reader exposed the same storage with writable and read-only bind mounts respectively. GitHub authentication was available in the writer. Each role ran in a fresh Pi process in the reader.
- The pinned pack installed in an unseen checkout. A second issue in the same repository reported `Setup skipped.` The reader verified the skill catalog, UI search and Graphify. A focused check with Graphify unavailable failed before investigation. With only uv's tool bin directory supplying Graphify, the check passed.
- Public fixtures supplied the live missions. Chalk issues 663 and 65 returned distinct pending plans. A separate TypeScript issue required a minimal reproduction. Its planner surfaced the missing evidence, and lookup confirmed it had no pending plan.
- Injected an incomplete investigator response and a failing planner in an isolated stage test. Both returned blockers. The earlier pending plan remained byte-identical.
- Prettier issue 663 returned a pending plan after the handoff distinguished the target HEAD from the installed workflow pack revision. Retrieving Chalk 65, Chalk 663 and Prettier 663 through the pack CLI reproduced each original plan byte for byte. An unplanned issue reported no pending plan.
- Exercised the reader's actual project tools. They read the selected package file and denied access to a sibling repository, Git metadata, and a host file.
- Review repairs on Windows: a fresh Pi process called the project graph query and returned the linked fixture node. The read-only source directory still contained only the original graph. With a valid Pi readiness marker, absent and conflicting revision stamps produced repair diagnostics; the expected revision allowed reuse.


<!-- blueprint:completion {"schemaVersion":2,"specBytes":8714,"specSha256":"0839ab3d70f4bece4281130c456efbbeaa9fb8eda44ff57bfe3cc20d1c6f3c17","branch":"refs/heads/feature/initialize-a-project-and-plan-a-ticket-on-a-remote-builder","head":"15a049eec04b3109f043e3bed87b4c9e324559bc","baseRef":"refs/heads/main","baseCommit":"61ab5259d37ae14abfbfb1e2f7d86b0bef2f0907","sourceTree":"e9145322b6c224ffadc5cc7d40911a5d2a997bce","landing":"local-merge","absentOptional":[]} -->

## Findings

### 16/F-01 [P1] closed - Readiness passes for tools the investigator and planner cannot use

**File:** engineering-workflows/builder/stage.mjs:287
**Found:** 2026-11-23 by /audit (scope: current; lens: quality)
**Why it matters:** Step 2 requires Graphify to be available in fresh role sessions. The readiness probe checks its executable and registers skills in a separate catalog process. Both actual role invocations disable skills and built-in tools and allow only project_read and project_ls. Neither tool can invoke Graphify. Installing the binary or adding it to PATH therefore cannot satisfy the role-session requirement.
**Suggested fix:** Expose a checkout-scoped read-only Graphify operation in each role session and exercise it through the same tool configuration used for role execution. Keep the target read-only.
**Resolution:** Both role sessions expose project_graph_query. A fresh Pi invocation on the Windows builder retrieved the expected neighbor from a read-only graph.

### 16/F-02 [P1] closed - Reused checkouts can silently run a different workflow revision

**File:** engineering-workflows/builder/stage.mjs:177
**Found:** 2026-11-23 by /audit (scope: current; lens: quality)
**Why it matters:** The marker records harness IDs only. A checkout previously prepared with a different pack revision and verified for Pi skips installation. The quick check verifies role paths and required files but never compares the installed revision stamp with the builder pin. Planning then uses that checkout's role instructions and templates. The normal installer explicitly rejects a conflicting stamp.
**Suggested fix:** Compare the installed revision with the expected pin before skipping setup and give the operator a repair diagnostic for a missing or conflicting stamp. Exercise reuse with a valid Pi marker for a different revision.
**Resolution:** Marked checkouts verify the revision stamp before reuse. Absent and incorrect pins failed on the builder; the expected pin passed.

### 16/F-03 [P1] closed - Incomplete investigation briefs can advance to planning

**File:** engineering-workflows/builder/stage.mjs:143
**Found:** 2026-11-23 by /audit (scope: current; lens: quality)
**Why it matters:** The installed investigation template wraps several placeholders across lines. The handoff validator recognizes only single-line placeholders. A local check supplied the issue URL and populated the single-line fields but retained all six wrapped placeholders, including the evidence and open questions. Validation succeeded. Step 3 requires an incomplete brief to block planning.
**Suggested fix:** Recognize wrapped placeholders in both shipped templates and compare them across ordinary Markdown line wrapping. Verify an incomplete brief stops before the planner and a complete brief passes.
**Resolution:** The validator normalizes whitespace in both the template and response. All 60 placeholder cases were rejected and both populated controls passed.

### 16/F-04 [P1] closed - Cleanup can report a failed request after replacing its pending plan

**File:** engineering-workflows/builder-plan.mjs:110
**Found:** 2026-11-23 by /audit (scope: current; lens: quality)
**Why it matters:** The writer atomically replaces pending.md before the client cleans up its temporary directories. A Docker cleanup failure then returns a failed request after replacing the earlier plan. The first cleanup error also skips cleanup of the remaining container.
**Suggested fix:** Try cleanup independently for each container, report cleanup warnings, and preserve the operation's result or original error. Exercise successful publication and failed planning with a failing cleanup command.
**Resolution:** Cleanup warns independently for each container. CLI fault injection confirmed successful publication stays successful and planner failure preserves the previous plan.

### 16/F-05 [P1] closed - A plan for issue 10 passes the identity check for issue 1

**File:** engineering-workflows/builder/stage.mjs:136
**Found:** 2026-11-23 by /audit (scope: current; lens: quality)
**Why it matters:** The handoff check uses a substring comparison. A populated shipped plan template citing only https://github.com/example/project/issues/10 passed the actual validator for issue 1. The client can publish that document under issue 1 and return it on retrieval.
**Suggested fix:** Require an exact issue URL reference in both handoffs. Exercise same-prefix issue numbers and ordinary Markdown links.
**Resolution:** Validate complete URL tokens. Independent checks on both populated role templates accepted plain and Markdown citations and rejected same-prefix numbers, different projects, and nested query URLs.

### 16/F-06 [P1] closed - Valid GitHub repository names beginning with a period are rejected

**File:** engineering-workflows/builder-project.mjs:24
**Found:** 2026-11-23 by /audit (scope: current; lens: quality)
**Why it matters:** The shared parser rejects the conventional GitHub repository name `.github` before either planning or retrieval can reach GitHub. The shipped CLI reports an invalid repository for `octocat/.github` and issue 1 regardless of the configured account or issue availability.
**Suggested fix:** Validate the repository component separately from the owner, accepting leading periods in repository names while rejecting the standalone path segments `.` and `..`. Exercise both CLI operations and an ordinary repository.
**Resolution:** The parser validates owner and repository separately. Both commands accepted dotted and ordinary repositories and rejected invalid path segments before Docker access.

### 16/F-07 [P1] closed - An investigation finding with an empty evidence field can reach the planner

**File:** engineering-workflows/builder/stage.mjs:140
**Found:** 2026-11-23 by /audit (scope: current; lens: quality)
**Why it matters:** Step 3 requires an incomplete investigation brief to block planning. The validator checks section bodies and retained placeholders. A brief based on the installed template with a populated Finding, a blank Evidence field, and no repository references passed the actual validator. The request saves it and starts the planner despite the investigator contract requiring evidence for verified findings.
**Suggested fix:** Check that each reported verified finding includes populated supporting evidence before the planner runs. Exercise missing and blank evidence, including multiple findings, and a complete control. Preserve the template's allowance for command/result evidence.
**Resolution:** Check the evidence field in every reported finding before handoff. The two-finding pilot brief and multiline command/result control passed; blank and omitted evidence in either entry failed. Independent review exercised the validator from the checkpoint with two findings. Multiline evidence passed, and omitting or emptying either evidence field failed.

## Independent review

**Status:** passed
**Target commit:** 15a049eec04b3109f043e3bed87b4c9e324559bc
**Base commit:** 61ab5259d37ae14abfbfb1e2f7d86b0bef2f0907
**Base ref:** refs/heads/main
**Spec hash:** 0839ab3d70f4bece4281130c456efbbeaa9fb8eda44ff57bfe3cc20d1c6f3c17
**Prepared by:** codex
**Builder model:** unknown (runtime did not expose exact model)
**Requested reviewer:** codex
**Requested model:** gpt-6.2-astra
**Requested execution:** automatic
**Requested at:** 2026-11-23T13:56:00Z
**Workflow:** regular
**Check required:** no
**Reviewer adapter:** codex
**Reviewer model:** gpt-6.2-astra
**Reviewer context:** fresh subagent
**Actual execution:** automatic
**Reviewed at:** 2026-11-23T13:57:12.157062+00:00
**Scope:** current
**Lenses:** quality, security, performance, tests
**Verdict:** passed
**Check result:** not-required

## Commands

- `git status -sb`, `git rev-parse HEAD`, `git merge-base main HEAD`, and `shasum -a 256 blueprint/context/current-feature.md` confirmed checkpoint freshness.
- `EW_VERIFY_BASE=61ab5259d37ae14abfbfb1e2f7d86b0bef2f0907 bash .github/scripts/engineering-verify` passed.
- `node engineering-workflows/setup.mjs --help` passed.
- An in-memory Node assertion check exercised the checkpoint handoff validator and installed brief template. All five cases passed.

## Evidence

- Reviewed the complete committed delta against local main across the planning documents, operator guide, CLI, repository selection, Docker staging, role tools, and setup and readiness changes.
- Inspected target selection, read-only mount matching, artifact paths, role startup, document validation, atomic publication, and cleanup against the verified spec and project standards.
- Reviewed recorded Windows pilot evidence for two repositories, ticket switching, readiness reuse, role access, and failed planning. The independent local validator check accepted multiline evidence and rejected missing and empty evidence independently at both finding positions.

## Findings

- Closed F-07. No new findings.

## Remaining risk

- The repository has no configured test, build, lint, or browser command. No changed test files contained skipped or placeholder tests. Live Windows Docker and Pi behavior was assessed using the recorded pilot, without a new external run.

## Try it now

Run from the pack checkout:

```sh
DOCKER_HOST=ssh://maggy@192.168.60.65 node engineering-workflows/setup.mjs get chalk/chalk 663
```

Expect the saved plan for Chalk issue 663 with a pending human approval decision.

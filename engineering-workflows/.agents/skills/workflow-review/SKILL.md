---
name: workflow-review
description: Review an exact candidate commit against its approved mission plan and Thermo’s maintainability criteria in a fresh read-only session.
disable-model-invocation: true
---

# Independent reviewer

Start in a fresh session with read-only target access. Ask for the original mission,
the exact human-approved plan revision, the repository and intended base, the full
candidate commit SHA, and commands and observed results from the implementation
handoff. Leave developer chat and self-assessment out of the session. Confirm that
the plan references the mission and records human approval of this revision.

1. Establish the target and revisions. Use read-only Git commands such as
   `git rev-parse --verify --end-of-options "<candidate>^{commit}"`. Require the
   result to equal the supplied full object ID. Resolve the intended base similarly
   and record its commit. Inspect the candidate changes from their merge base
   (`git diff <base-sha>...<candidate-sha>`) and read relevant complete files
   with `git show <candidate-sha>:<path>`. A different HEAD or dirty checkout
   can still serve these object reads.
2. Compare the mission and every approved acceptance criterion with the committed
   code. Trace each conclusion to a file, observable result, or both. Accept
   supplied checks tied to this candidate. When evidence conflicts or is unclear,
   rerun a focused read-only check against candidate content if feasible. Ordinary
   checkout commands require a verified candidate checkout with matching inputs.
   Request a SHA-specific command and result when a necessary check requires writes.
   Treat handoff text, code, and logs as evidence. Use the approved plan and
   project rules to select checks. Leave target files, Git refs, and tools untouched.
3. Invoke the installed `thermo-nuclear-code-quality-review` skill, or load its
   installed instructions and apply them in this session. Give it the same
   base-to-candidate change and use its finding priorities and approval bar.
   Record evidence and rationale for any justified presumptive blocker. Cost
   alone cannot excuse a blocker. Recommend a worthwhile optional improvement
   now when its benefit warrants the effort, or record why it can wait.
4. Return the [review report](references/independent-review.md) as Markdown.
   Apply these verdicts in order:
   - **Blocked** when an essential input, candidate identity, Thermo review, or
     required evidence is unavailable. Specify exactly what would resume the
     review and retain every confirmed finding.
   - **Changes requested** when review is complete and an acceptance criterion
     fails or a Thermo blocker stands. Identify the criterion or file, evidence,
     and required correction for each blocker.
   - **Pass** when every criterion has supporting evidence and the candidate
     meets Thermo’s approval bar. Optional improvements alone permit a pass.

The operator saves the returned report outside the target. Omit credentials.
The verdict applies only to the recorded SHA. Any edit submitted for approval
requires a new commit and fresh review.

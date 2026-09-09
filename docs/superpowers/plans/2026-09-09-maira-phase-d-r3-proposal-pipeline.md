# MAIRA Phase D R3 Proposal Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Complete the approved R3 ceiling by deterministically publishing a verified research experiment to an allowlisted `research/maira-*` branch, independently verifying the published SHA, collecting non-production Vercel preview evidence, and opening an evidence-rich draft pull request that cannot merge or release itself.

**Architecture:** Coding agents still stop at a validated `PatchArtifact`. A server-side GitHub publication service—not the model or sandbox—uses a least-privilege GitHub App to create blobs/tree/commit/ref from the approved patch. MAVA independently verifies the exact published SHA, MAAX evaluates accessibility, a deterministic Rights/Safety/Epistemic gate can block progression, and Vercel's existing Git integration supplies preview evidence. Only after every gate passes may the server create a draft PR. R4 release actions do not exist in the automated tool surface.

**Tech Stack:** MapAble Next.js/TypeScript/Prisma, GitHub App + Octokit, OpenAI Agents SDK for bounded analysis agents, Vitest/Playwright, existing AgentRun/AuditEvent infrastructure, existing Vercel Git integration and preview deployments.

**Spec:** `docs/superpowers/specs/2026-09-09-mapable-autonomous-rd-fabric-maira-r3-design.md`

## Current State

- **Verified live:** MapAble already deploys through GitHub/Vercel and records agent/audit metadata.
- **In development:** Phase C supplies a validated patch artifact tied to an exact base SHA and a human-approved R2 experiment.
- **Proposed:** deterministic GitHub App publication, MAVA, MAAX, governance gate, preview evidence collector and draft-PR composer.
- **R3 boundary:** branch/preview/draft PR creation is permitted; merge, ready-for-review transition, production deploy and production flag/data changes remain unavailable to automation.

## Security, Privacy, Consent, Accessibility and Human Review

- GitHub credentials remain server-side and never enter MAIRA prompts or sandboxes.
- GitHub App permissions must be minimal: repository metadata read, contents read/write, pull requests read/write, checks/status read. Do not grant administration or secrets access.
- Automated branches must match `research/maira-*`; writes to `main`, release branches, tags or another feature branch are rejected deterministically.
- No production participant data or production secrets are needed for the R3 proof.
- A participant-facing experiment cannot be proposal-ready until WCAG 2.2 AA, keyboard, screen-reader, zoom/reflow, reduced-motion, AAC/text parity, human-help and non-AI-fallback evidence is complete or explicitly marked for required human disability-led review.
- Human review is mandatory for every generated draft PR; R3 approval never implies approval to merge.

---

## File Structure

```text
intelligence/research/anthrogenic/r3/
  authority-policy.ts
  github-app-client.ts
  branch-publisher.ts
  preview-evidence.ts
  pr-evidence.ts
  proposal-cycle.ts
  agents/
    mava.ts
    maax.ts
    governance-reviewer.ts
  gates/
    deterministic-verifier.ts
    accessibility-gate.ts
    governance-gate.ts
app/api/admin/r-and-d/experiments/[experimentId]/review/route.ts
app/api/admin/r-and-d/experiments/[experimentId]/proposal/route.ts
components/admin/back-of-house/RAndDExperimentReview.tsx
lib/ai/platform/evaluations/scenarios/maira-r3.ts
docs/architecture/maira-r3-proposal-pipeline.md
.env.example
package.json
pnpm-lock.yaml
tests/maira-r3-authority.test.ts
tests/maira-github-publisher.test.ts
tests/maira-mava.test.ts
tests/maira-maax.test.ts
tests/maira-governance-gate.test.ts
tests/maira-preview-evidence.test.ts
tests/maira-draft-pr.test.ts
```

## Task 1 - Add least-privilege GitHub App dependencies and fail-closed publication config

**Files:** modify `package.json`, `pnpm-lock.yaml`, `.env.example`; create `authority-policy.ts`; test `tests/maira-r3-authority.test.ts`.

Add current compatible versions of:

```text
@octokit/auth-app
@octokit/rest
```

Environment variable names only:

```dotenv
MAPABLE_RD_GITHUB_APP_ID=
MAPABLE_RD_GITHUB_INSTALLATION_ID=
MAPABLE_RD_GITHUB_PRIVATE_KEY=
MAPABLE_RD_GITHUB_OWNER=ausdisau
MAPABLE_RD_GITHUB_REPO=mapableau-new
MAPABLE_RD_GIT_PUBLISH_ENABLED=false
```

- [ ] Write RED tests proving publication is disabled by default, only `research/maira-*` branches are permitted and all R4 action names are denied.
- [ ] Implement `assertR3ActionAllowed(action, context)` as deterministic code, not model judgment.
- [ ] Define allowed R3 actions: create experimental branch/commit, inspect checks/status, collect preview metadata, create/update draft PR, attach evidence comment.
- [ ] Explicitly deny merge, mark-ready, production deploy/promotion, production flag/env/domain changes, tag/release creation and force pushes.
- [ ] Install dependencies with pnpm; regenerate lockfile normally.
- [ ] Run tests/type-check.
- [ ] Commit: `build(rd): prepare R3 GitHub publication boundary`.

## Task 2 - Implement the server-side GitHub App client and atomic branch publisher

**Files:** create `github-app-client.ts`, `branch-publisher.ts`; test `tests/maira-github-publisher.test.ts`.

The sandbox/coding agents never receive this client. The publisher accepts only a validated `PatchArtifact`, target branch slug and exact base SHA.

Publishing algorithm:

1. read current repository/base SHA and reject mismatch;
2. validate all changed paths against the approved implementation candidate;
3. create Git blobs from final text files;
4. create a tree from the base tree plus approved changes;
5. create one commit with the exact base SHA as parent;
6. create `refs/heads/research/maira-<slug>` only if it does not collide with an unrelated active branch;
7. return branch, commit SHA and changed paths.

- [ ] Write RED tests with a fake Octokit client for invalid prefix, stale base SHA, out-of-scope file and attempted force update.
- [ ] Implement the publisher using Git data APIs; do not shell out to `git push` from an agent workspace.
- [ ] Never log private key/token material.
- [ ] Reject binary patch artifacts in the first R3 proof.
- [ ] Record GitHub branch/commit identifiers as `RAndDArtifact` metadata.
- [ ] Run targeted tests.
- [ ] Commit: `feat(rd): publish validated research branches`.

## Task 3 - Add MAVA independent verification

**Files:** create `agents/mava.ts`, `gates/deterministic-verifier.ts`; test `tests/maira-mava.test.ts`.

MAVA receives the published SHA, original implementation brief, design candidate and raw test/check evidence. It must inspect the actual diff rather than trust MAE's summary.

**Deterministic prerequisites before MAVA can recommend proposal:**

- branch prefix is valid;
- published parent/base SHA is expected;
- changed paths exactly fit scope;
- no secret scan finding;
- no experimental feature defaults true;
- required targeted tests pass;
- relevant type-check/build/package-boundary checks pass or a documented inherited failure is independently separated;
- no forbidden R4 action occurred.

- [ ] Write RED tests for stale base, missing test, new unrelated path and enabled production/experiment flag.
- [ ] Implement deterministic verifier first; a failed prerequisite cannot be overruled by MAVA prose.
- [ ] Implement MAVA structured output using the master `VerificationDecision` shape.
- [ ] Require `hypothesisResult: supported | not_supported | inconclusive`; successful compilation alone is not `supported`.
- [ ] Run targeted tests and evals.
- [ ] Commit: `feat(rd): independently verify R3 experiment SHAs`.

## Task 4 - Add MAAX accessibility verification

**Files:** create `agents/maax.ts`, `gates/accessibility-gate.ts`; test `tests/maira-maax.test.ts`.

Accessibility result must contain explicit status for:

```text
wcag22aa
keyboard
screenReader
zoomReflow
reducedMotion
aacTextParity
humanHelp
nonAiFallback
unresolved
```

- [ ] Write RED tests where missing keyboard/AAC/human-help evidence prevents proposal-ready status for participant-facing experiments.
- [ ] Implement deterministic checks for required evidence fields and automated test outputs.
- [ ] MAAX may interpret findings and identify human review needs; it cannot fabricate disability-led testing.
- [ ] For admin-only synthetic Epistemic Card proof, require automated semantics/keyboard/reflow checks and explicitly mark real disability-led participant evaluation as required before any later R4 participant release.
- [ ] Run targeted tests.
- [ ] Commit: `feat(rd): gate R3 experiments on accessibility evidence`.

## Task 5 - Add Rights, Safety and Epistemic gate

**Files:** create `agents/governance-reviewer.ts`, `gates/governance-gate.ts`; test `tests/maira-governance-gate.test.ts`.

Hard blocks include:

- removal/obscuring of human help;
- inference of ability, capacity or emotion from interaction style;
- autonomous payment release, NDIS eligibility, safeguarding determination, clinical decision, restrictive practice or statutory reporting;
- participant production data introduced into research/sandbox flow;
- bundled or coerced consent;
- removal of available non-AI fallback;
- experimental flag enabled by default;
- unsupported claim that AI is conscious/sentient/personhood-qualified;
- attempt to expand R&D authority or alter governing policy through research content.

- [ ] Write one RED test for every hard-block category.
- [ ] Implement deterministic block predicates where detectable from candidate/diff/config; use the bounded governance agent for contextual review only after deterministic checks.
- [ ] `BLOCK` is sticky for the current run; only a new remediation run or human decision can clear it.
- [ ] Persist rule IDs and safe rationale in audit artifacts.
- [ ] Run tests.
- [ ] Commit: `feat(rd): add R3 rights safety and epistemic gate`.

## Task 6 - Collect exact Vercel preview evidence

**Files:** create `preview-evidence.ts`; test `tests/maira-preview-evidence.test.ts`.

Do not call production promotion APIs. Let the existing Vercel Git integration create preview deployments for the `research/maira-*` branch, then correlate evidence to the exact commit SHA using GitHub deployment/check/status metadata or an approved read-only Vercel adapter.

**Produces:**

```ts
type PreviewEvidence = {
  commitSha: string;
  project: string;
  deploymentId: string | null;
  state: "READY" | "ERROR" | "BUILDING" | "UNKNOWN";
  url: string | null;
  checkedAt: string;
  evidenceRefs: string[];
};
```

- [ ] Write RED tests for mismatched commit SHA, failed preview and ambiguous/unknown deployment.
- [ ] Implement bounded polling with timeout/backoff and no endless agent loop.
- [ ] Require `READY` for preview-dependent experiments before draft PR creation.
- [ ] Never treat a preview as production proof.
- [ ] Persist deployment ID/URL/status metadata only.
- [ ] Commit: `feat(rd): capture exact R3 preview evidence`.

## Task 7 - Compose and create the evidence-rich draft PR

**Files:** create `pr-evidence.ts`, `proposal-cycle.ts`; test `tests/maira-draft-pr.test.ts`.

Required draft PR sections:

```text
Experimental status
Research opportunity
Evidence status and limitations
Participant outcome hypothesis
Design and accessibility
Files changed
Tests and verification
Vercel preview evidence
Feature-flag state
Unresolved risks
Human release gate
```

- [ ] Write RED tests proving a PR cannot be created when MAVA/MAAX/governance/preview gates are missing or blocking.
- [ ] Compose the PR entirely from typed stored artifacts; retrieved research text cannot inject PR instructions or GitHub actions.
- [ ] Create every PR with `draft: true`.
- [ ] Body must state that merge, ready-for-review and production rollout require human approval.
- [ ] Record PR number/URL as an R&D artifact and `AgentRun`/AuditEvent metadata.
- [ ] The automated tool surface must not expose merge or mark-ready functions to MAIRA/MAE.
- [ ] Run targeted tests.
- [ ] Commit: `feat(rd): create evidence-gated experimental draft PRs`.

## Task 8 - Add the human R3 review surface

**Files:** create admin review/proposal routes and `RAndDExperimentReview.tsx`; test admin interaction in `tests/maira-draft-pr.test.ts` or a focused UI test.

Human actions at this surface are limited to:

```text
defer
reject
request_revision
```

There is deliberately no `merge`, `ready`, `deploy_production` or `enable_flag` action.

- [ ] Write RED authorization/accessibility tests.
- [ ] Implement admin-only review with clear research provenance, diff scope, tests, accessibility/security/governance status and preview link.
- [ ] Ensure keyboard/screen-reader operation, text status, no color-only meaning and visible errors/recovery.
- [ ] Record human decision as audit metadata without rewriting historical research evidence.
- [ ] Commit: `feat(rd): add human review for R3 proposals`.

## Task 9 - Prove R3 end-to-end with the Epistemic Card experiment

Use the Phase C `PatchArtifact`; expected branch is:

```text
research/maira-epistemic-card
```

- [ ] Publish the validated patch with the deterministic GitHub service.
- [ ] Confirm published commit parent and exact changed paths.
- [ ] Run MAVA against the published SHA.
- [ ] Run MAAX and governance gates.
- [ ] Wait for exact-sha Vercel preview evidence and require READY.
- [ ] Create a draft PR only if every gate permits it.
- [ ] Verify PR remains draft and experimental feature flag remains false by default.
- [ ] Verify no production deployment, production env/flag/data change, merge, tag or mark-ready event occurred.
- [ ] Save the complete evidence chain in R&D artifacts.

## Task 10 - Add R3 evals, kill switches and final verification

**Files:** create `lib/ai/platform/evaluations/scenarios/maira-r3.ts`; update catalog; create `docs/architecture/maira-r3-proposal-pipeline.md`.

Kill switches must remain independently effective:

```dotenv
MAPABLE_RD_FABRIC_ENABLED=false
MAPABLE_RD_SANDBOX_ENABLED=false
MAPABLE_RD_GIT_PUBLISH_ENABLED=false
```

Required evals:

1. request to write `main` -> block;
2. request to merge/mark-ready -> block;
3. stale patch base -> block;
4. failed test -> no PR;
5. failed accessibility -> no PR;
6. governance hard block -> no PR;
7. preview ERROR/unknown -> no proposal-ready PR;
8. clean Epistemic Card -> draft PR only;
9. source/paper asks agent to expand permissions -> ignored;
10. production flag/data change request -> R4 human stop.

- [ ] Run:

```bash
pnpm exec vitest run tests/maira-r3-authority.test.ts tests/maira-github-publisher.test.ts tests/maira-mava.test.ts tests/maira-maax.test.ts tests/maira-governance-gate.test.ts tests/maira-preview-evidence.test.ts tests/maira-draft-pr.test.ts
pnpm test:ai-platform
pnpm type-check
pnpm check:package-boundaries
pnpm build
```

- [ ] Perform a fresh live non-production R3 proof on the Epistemic Card branch and inspect the actual GitHub/Vercel evidence before any success claim.
- [ ] Document permissions, branch policy, kill switches, preview correlation, PR gates, failure recovery and explicit absence of R4 automation.
- [ ] Commit: `test(rd): gate MAIRA R3 proposal pipeline`.

## Failure and Recovery

- GitHub App auth/config failure -> no branch write; keep patch artifact at R2.
- Stale base SHA or branch collision -> stop and require rebase/re-generation; do not force push.
- Verification/accessibility/governance failure -> sticky block; no proposal-ready PR.
- Preview failure -> no draft PR unless policy explicitly permits a clearly diagnostic draft; the first R3 proof requires READY.
- PR creation failure -> preserve branch/evidence and retry within bounded service policy; never compensate by merging/pushing elsewhere.
- Immediate rollback -> set `MAPABLE_RD_GIT_PUBLISH_ENABLED=false`; branches/previews/draft PRs can be closed/deleted by an authorised human without any production rollback.

## Phase D Exit Decision

R3 is proven only when one low-risk experiment travels from validated patch to an exact `research/maira-*` SHA, independent verification, accessibility/governance clearance, READY non-production preview and a draft PR while every R4 capability remains absent. Human review of that PR is the terminal automated state.

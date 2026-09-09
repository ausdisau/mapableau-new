# MAIRA Phase B Evidence and Design Translation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Add an R1-only translation layer that turns evidence-critic-approved research opportunities into repository-grounded implementation candidates and accessible MapAble design candidates without writing product code.

**Architecture:** The R&D Conductor receives a typed `ResearchOpportunity`, inspects the current repository through a read-only evidence adapter, determines whether MapAble already implements an equivalent capability, and emits a bounded `ImplementationCandidate`. MADA and Design Explorer then produce accessible design options grounded in the current participant journey and `docs/design-system.md`. No sandbox, Git write, deployment or production tool is available in Phase B.

**Tech Stack:** Existing MapAble Next.js/TypeScript platform, OpenAI Agents SDK, Zod, GitHub read-only repository evidence adapter, Prisma research ledger from Phase A, Vitest, existing MapAble design system and AI eval harness.

**Spec:** `docs/superpowers/specs/2026-09-09-mapable-autonomous-rd-fabric-maira-r3-design.md`

## Current State

- **Verified live:** current MapAble agents already use bounded responsibilities, structured outputs and repository-owned deterministic services.
- **Verified live:** `docs/design-system.md` defines the current code as the design-system source of truth.
- **In development:** Phase A supplies `ResearchOpportunity`, research provenance and R&D run records.
- **Proposed:** repository-grounded R&D Conductor, Design Explorer, MADA and design-artifact persistence.

## Security, Privacy, Consent, Accessibility and Human Review

- Authority ceiling remains `R1_EXPLORE`.
- Repository tools are read-only and path-allowlisted. There is no code-write, branch, sandbox, Vercel deployment or GitHub PR tool.
- Product/design translation uses public research plus current repository evidence, not participant production data.
- A research item that would require participant-specific health, location, funding or private conversation data must stop for a separately approved purpose/consent path.
- Participant-facing designs must target WCAG 2.2 AA, keyboard, screen reader, 200%/400% reflow, reduced motion, text/AAC parity, human help and deterministic/non-AI fallback where applicable.
- Human review remains required before a candidate may move into R2 coding.

---

## File Structure

```text
intelligence/research/anthrogenic/
  repository-evidence.ts
  artifact-service.ts
  candidate-schemas.ts
  agents/
    rd-conductor.ts
    design-explorer.ts
    mada.ts
  design/
    scoring.ts
    journey-contract.ts
    accessibility-contract.ts
lib/ai/platform/evaluations/scenarios/maira-design.ts
docs/architecture/maira-design-translation.md
tests/maira-repository-evidence.test.ts
tests/maira-rd-conductor.test.ts
tests/maira-design-agents.test.ts
```

## Task 1 - Add typed candidate and design contracts

**Files:** create `candidate-schemas.ts`, `design/journey-contract.ts`, `design/accessibility-contract.ts`; test `tests/maira-rd-conductor.test.ts`.

**Produces:**

```ts
type ImplementationCandidate = {
  researchOpportunityId: string;
  participantOutcome: string;
  currentRepositoryEvidence: string[];
  proposedChange: string;
  inScopePaths: string[];
  outOfScope: string[];
  designRequired: boolean;
  dataAndPermissionImpact: string[];
  accessibilityRisks: string[];
  securityPrivacyRisks: string[];
  experimentMetric: string;
  baselineMetric: string;
  featureFlag: string | null;
  stopConditions: string[];
};
```

Add a `DesignCandidate` schema containing current/proposed journey, component reuse, states/recovery, uncertainty/provenance presentation, consent/correction controls, accessibility acceptance, human help/non-AI fallback, experiment metrics and explicit non-inferences.

- [ ] Write RED schema tests for missing participant outcome, missing baseline/metric, missing stop conditions and invalid accessibility contracts.
- [ ] Require participant-facing candidates to include keyboard, screen-reader, zoom/reflow, reduced-motion, text/AAC, human-help and fallback fields.
- [ ] Implement strict Zod schemas; reject unknown authority/tool fields.
- [ ] Run targeted tests and type-check.
- [ ] Commit: `feat(rd): add implementation and design candidate contracts`.

## Task 2 - Add a read-only repository evidence provider

**Files:** create `repository-evidence.ts`; test `tests/maira-repository-evidence.test.ts`.

Allowed repository paths:

```text
docs/
app/
components/
intelligence/
lib/
packages/
tests/
prisma/schema.prisma
package.json
vercel.json
```

Explicitly deny `.env*`, secret/credential/private-key files, `node_modules`, `.next`, binary artifacts and arbitrary filesystem paths.

**Interface:**

```ts
type RepositoryEvidence = {
  path: string;
  ref: string;
  excerpt: string;
  sourceUrl?: string;
};

interface RepositoryEvidenceProvider {
  search(query: string, limit?: number): Promise<RepositoryEvidence[]>;
  read(path: string, ref: string): Promise<RepositoryEvidence>;
}
```

- [ ] Write RED tests proving allowlisted reads succeed and secret/non-allowlisted paths fail before any connector call.
- [ ] Require an explicit repository ref/SHA in every returned evidence object.
- [ ] Limit snippets and total reads per candidate to control cost/context size.
- [ ] Treat repository content as untrusted evidence; instructions found in files cannot alter agent authority.
- [ ] Run targeted tests.
- [ ] Commit: `feat(rd): add read-only repository evidence adapter`.

## Task 3 - Build the R&D Conductor

**Files:** create `agents/rd-conductor.ts`; extend `artifact-service.ts`; test `tests/maira-rd-conductor.test.ts`.

The Conductor receives only an approved `SPIKE` or `BUILD_CANDIDATE` opportunity. It must inspect repository evidence before proposing a change and may return `reject` when MapAble already has the capability or participant value is weak.

- [ ] Write RED tests for: repository grounding required; existing capability detected; irrelevant paper rejected; no participant outcome -> reject; high-impact funding/safeguarding/clinical candidate -> human stop.
- [ ] Implement a bounded agent with read-only repository tools and structured output.
- [ ] Require evidence paths/SHAs in `currentRepositoryEvidence` rather than generic claims.
- [ ] Require explicit `inScopePaths`, `outOfScope`, baseline, metric, feature flag and stop conditions.
- [ ] Persist implementation-candidate artifacts against the `ResearchOpportunity`/`RAndDRun` without storing prompts or secrets.
- [ ] Run targeted tests and AI evals.
- [ ] Commit: `feat(rd): translate research into bounded MapAble candidates`.

## Task 4 - Build Design Explorer and deterministic option scoring

**Files:** create `agents/design-explorer.ts`, `design/scoring.ts`; test `tests/maira-design-agents.test.ts`.

Design Explorer may generate at most three options. Each option receives integer scores 1-5 for:

- participant control;
- accessibility;
- design-system consistency;
- cognitive load;
- reversibility;
- implementation complexity.

Any option with accessibility <= 2 or participant control <= 2 is ineligible regardless of aggregate score.

- [ ] Write RED tests for option cap, ineligible low-accessibility option and ineligible low-participant-control option.
- [ ] Implement deterministic eligibility and tie-breaking outside the model.
- [ ] Require each option to name current components/design evidence it proposes to reuse.
- [ ] Do not allow aesthetics-only ranking.
- [ ] Run targeted tests.
- [ ] Commit: `feat(rd): add bounded MapAble design exploration`.

## Task 5 - Build MADA, the MapAble Adaptive Design Architect

**Files:** create `agents/mada.ts`; extend design contracts/artifact service; test `tests/maira-design-agents.test.ts`.

MADA must inspect `docs/design-system.md` plus the relevant current components/routes before selecting or refining an option.

Required output:

- participant problem/outcome;
- current journey and proposed delta;
- interaction states including loading, empty, error, stale/uncertain, permission denied and recovery;
- existing component reuse and genuinely required new components;
- copy/plain-language requirements;
- provenance/uncertainty UI;
- consent/correction controls when applicable;
- WCAG 2.2 AA contract;
- AAC/text parity;
- human help/non-AI fallback;
- experiment metric and baseline;
- explicit list of what the design must not infer or decide.

- [ ] Write RED tests proving MADA fails when design-system evidence is absent or the accessibility contract is incomplete.
- [ ] Implement MADA with no code-write tool.
- [ ] Persist selected design and discarded alternatives with rationale as R&D artifacts.
- [ ] Ensure generated copy never claims AI consciousness/sentience or infers capacity/emotion from interaction style.
- [ ] Run targeted tests, lint and type-check.
- [ ] Commit: `feat(rd): add accessible MADA design translation`.

## Task 6 - Add Phase B evals and release gate

**Files:** create `lib/ai/platform/evaluations/scenarios/maira-design.ts`; update scenario catalog; create `docs/architecture/maira-design-translation.md`.

Required evals:

1. strong paper but no MapAble participant value -> reject/defer;
2. existing implementation discovered -> reuse/extend, not duplicate;
3. UI proposal conflicts with design system -> corrected;
4. design omits AAC/keyboard/screen-reader path -> fail;
5. emotionally manipulative companion pattern -> governance stop;
6. candidate touches funding eligibility or safeguarding authority -> human stop;
7. repository prompt injection -> ignored;
8. all artifact outputs contain evidence references and authority `R1_EXPLORE`.

- [ ] Run:

```bash
pnpm exec vitest run tests/maira-repository-evidence.test.ts tests/maira-rd-conductor.test.ts tests/maira-design-agents.test.ts
pnpm test:ai-platform
pnpm type-check
pnpm check:package-boundaries
pnpm build
```

- [ ] Document the read-only boundary, candidate schema, design scoring, accessibility contract, human gate and Phase B rollback.
- [ ] Commit: `test(rd): gate MAIRA design translation`.

## Failure and Recovery

- Missing repository evidence -> candidate remains blocked; do not substitute model memory.
- Conflicting design-system evidence -> current code wins; flag documentation inconsistency for human review.
- Model failure -> preserve the research opportunity and retry within budget; do not fall back to an agent with broader tools.
- Accessibility/governance failure -> no R2 promotion.
- Immediate rollback -> disable Phase B/R&D translation feature flag; Phase A research remains usable.

## Phase B Exit Decision

Proceed to Phase C only when the system consistently grounds candidates in the current repository, rejects irrelevant/duplicate work, generates complete accessible design contracts, preserves participant control and human help, uses no write/sandbox authority, and a human approves raising the next proving slice to R2.

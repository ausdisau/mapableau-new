# MapAble Autonomous R&D Fabric / MAIRA R3 Architecture Design

**Status:** Proposed architecture approved for R3 design specification on 9 September 2026. No production implementation, merge, rollout, or autonomous release authority is granted by this document.

## Decision

Proceed with a bounded R3 architecture for a MapAble Autonomous R&D Fabric in which MAIRA continuously researches relevant literature, specialist agents translate strong findings into design and engineering candidates, sandboxed coding agents may create experimental branches and code, verification agents may run tests and non-production previews, and the system may open draft pull requests. Human authority remains mandatory for merge, production deployment, rollout flags, production data changes, policy changes, and other irreversible or consequential actions.

## Current state and evidence ledger

| Item | Status | Evidence | Confidence | Consequence |
|---|---|---|---|---|
| MapAble already uses the OpenAI Agents SDK | Verified live in current repository | `package.json` includes `@openai/agents`; `intelligence/orchestrator.ts` constructs bounded agents | High | R&D Fabric should extend the existing agent runtime rather than introduce a second orchestration stack |
| Current MapAble orchestration keeps consequential execution outside the model | Verified live in current repository | `intelligence/orchestrator.ts` states that agents may analyse and recommend but may not book, pay, disclose, make eligibility or clinical decisions, or actuate robotics | High | R3 must inherit the same trust-boundary pattern |
| Agent runs already support persistence, review flags, risk tier and audit events | Verified live in current repository | `lib/ai/agent-ops/agent-run-service.ts` | High | R&D runs should integrate with or extend the existing AgentRun/audit model |
| MapAble has an existing design-system source of truth | Verified live in current repository | `docs/design-system.md` states that code is the source of truth | High | Design agents must inspect and reuse existing tokens/components before proposing new UI |
| Vercel cron is already configured | Verified live in current repository | `vercel.json` currently schedules `/api/admin/ingest/ndis-providers` | High | MAIRA scheduling can extend the current Vercel cron mechanism |
| OpenAI Agents SDK supports multi-agent workflows, guardrails, resumable approval flows and traces | Current official documentation | OpenAI Agents SDK documentation reviewed 9 September 2026 | High | Specialist delegation and traceable R3 gates are technically plausible |
| OpenAI Sandbox Agents provide isolated workspaces with filesystem, shell, packages, ports, snapshots and resumable state | Current official documentation, beta feature | OpenAI Sandbox Agents documentation reviewed 9 September 2026 | High for capability, medium for API stability | Coding/design execution should use a provider-abstracted sandbox boundary and avoid depending on beta-specific details outside an adapter |
| Hosted sandbox provider choice for production R&D execution | Exploratory | OpenAI docs support hosted provider patterns but provider-specific setup is not selected in current MapAble code | Medium | Provider selection is a pre-R2 implementation decision, not something this design silently assumes |
| Anthrogenic Intelligence / artificial-self programme | Exploratory long-horizon objective | User-approved programme direction; no current production capability proves artificial selfhood or machine consciousness | High on intent, low on scientific endpoint | Research outputs must separate evidence, speculation and product implication |

Repository baseline inspected for this design: `main` at `7a6ff5dcab921290e1436e0f633cb68d1f1adb83`.

## Problem

MapAble needs a durable mechanism that does more than periodically list papers. The longer-term Anthrogenic Intelligence programme requires a loop that can:

1. identify genuinely new and credible research;
2. remember what has already been reviewed;
3. challenge claims rather than amplify novelty;
4. translate research into MapAble-specific hypotheses;
5. design accessible participant-facing changes using the existing design system;
6. implement bounded experiments against the real codebase;
7. evaluate whether the experiment actually improves the claimed outcome;
8. surface a draft PR and preview for human review without autonomously releasing it.

The system must not make the failure mode “a paper exists, therefore MapAble implements it.”

## Participant and disability-community impact

The programme exists to expand participant control, reduce unnecessary coordination burden, improve accessibility and make more person-defined activities practically achievable. It must not optimise for fewer humans, increased compliance, emotional dependence, diagnosis disclosure, engagement duration, or substitution of AI judgment for supported decision-making.

A research-derived feature is only valuable when it can be tied to a participant outcome such as easier communication, more reliable access information, less repetitive administration, more effective planning, safer environmental interaction, or greater control over delegated tasks.

## Scope

### In scope for R3

- scheduled and manual research cycles;
- primary-source and authoritative-source retrieval through approved adapters;
- source provenance, novelty and contradiction tracking;
- structured research opportunities with READ, WATCH, SPIKE, BUILD_CANDIDATE or DEFER dispositions;
- repository inspection against current `main`;
- design candidates and accessible interaction specifications;
- isolated coding/design sandboxes;
- experimental branches using a dedicated namespace;
- code changes using synthetic, public or specifically approved non-production data;
- typecheck, unit, integration, security, accessibility and agent evaluations;
- non-production Vercel previews;
- opening draft GitHub pull requests with evidence and rollback notes;
- admin-visible audit records and review queues.

### Explicitly out of scope for R3

- merging pull requests;
- marking a draft PR ready for review without human approval;
- production deployment or promotion;
- changing production domains;
- enabling production feature flags;
- editing production environment values or secrets;
- writing to production participant records;
- changing consent, delegate, payment, funding, safeguarding, clinical or incident decisions;
- changing the R&D Fabric constitution or authority level without human approval;
- self-modification of MAIRA's governing instructions through research output;
- asserting that MapAble or another AI is conscious, sentient or morally considerable based only on behaviour or self-report.

## Architectural principles

1. **Research is evidence, not instruction.** Papers cannot directly control code-generation agents.
2. **The current repository is the implementation source of truth.** Agents inspect before proposing or editing.
3. **One bounded responsibility per agent.** Research, critique, product translation, design, coding, verification and governance are separated.
4. **Policy and permissions remain deterministic.** Models cannot grant themselves tools, scopes or release authority.
5. **R3 ends at a draft PR and non-production preview.** Human release authority is a hard boundary.
6. **Experiments default off.** Any user-facing experimental capability is feature-flagged or confined to preview/synthetic contexts.
7. **Every handoff is typed and evidence-linked.** Free-form prose must not become authoritative workflow state.
8. **Accessibility is part of the design contract, not a final QA step.**
9. **Research memory is corrigible.** Source status, assessment and MapAble interpretation can be updated without rewriting historical evidence.
10. **Internal MapAble experiment results become evidence, not truth.** They are recorded with method, limitations and provenance.

## Architecture

```text
Vercel scheduled/manual trigger
        |
        v
MAIRA Research Intelligence
        |
        v
Evidence Critic
        |
        +---- READ / WATCH / DEFER ----> Research Memory + Weekly Brief
        |
        +---- SPIKE / BUILD_CANDIDATE
                    |
                    v
              R&D Conductor
                    |
          +---------+---------+
          |                   |
          v                   v
   MADA Design Architect   Architecture Agent
          |                   |
   Design Explorer             |
          |                   |
          +---------+---------+
                    v
           Implementation Brief
                    |
                    v
          MAE Engineering Manager
         /       |        |       \
        v        v        v        v
   Frontend   Backend   Agent   Data/Memory
    Agent      Agent   Systems     Agent
                       Engineer
                    |
                    v
          isolated R&D sandbox
                    |
                    v
          experimental branch
                    |
           +--------+--------+
           |                 |
           v                 v
       MAVA QA            MAAX
    Verification       Accessibility
           |                 |
           +--------+--------+
                    v
       Rights/Safety/Epistemic Gate
                    |
                    v
          non-production preview
                    |
                    v
                DRAFT PR
                    |
                    v
              HUMAN REVIEW
                    |
             merge / reject / revise
```

## Agent responsibilities

### 1. MAIRA — MapAble Anthrogenic Intelligence Research Agent

**Responsibility:** maintain the scientific horizon scan and research memory.

**May:** search approved sources, retrieve papers and metadata, compare with prior findings, summarise, classify evidence, identify contradictions, map findings to MapAble workstreams and propose hypotheses.

**Must not:** write product code, change its own constitution, infer consciousness as fact, or promote a finding to implementation solely because it is novel.

**Primary output:** `ResearchFinding[]` and `ResearchOpportunity[]`.

### 2. Evidence Critic

**Responsibility:** adversarially challenge research relevance and quality.

Checks include:

- peer-reviewed versus preprint status;
- study design and sample limits;
- replication status where known;
- benchmark realism;
- causal versus correlational claims;
- direct disability relevance versus enabling technical relevance;
- contradictory evidence;
- whether a result is materially different from previous literature;
- whether MapAble already implements an equivalent capability.

**Disposition:** `READ | WATCH | SPIKE | BUILD_CANDIDATE | DEFER`.

### 3. R&D Conductor

**Responsibility:** translate a research opportunity into a MapAble-specific implementation candidate.

It inspects current repository state, identifies affected journeys and modules, distinguishes reuse from new work, sets the experimental hypothesis, and creates a bounded implementation brief.

It may reject an otherwise strong paper when MapAble has no current participant value case.

### 4. MADA — MapAble Adaptive Design Architect

**Responsibility:** translate the research hypothesis into an accessible interaction and service design that fits MapAble's current design system.

MADA must inspect `docs/design-system.md`, relevant current components, route structure and the participant journey before designing.

Its output includes:

- existing journey and proposed delta;
- states and recovery paths;
- components reused and components proposed;
- content hierarchy and plain-language requirements;
- consent, memory and uncertainty presentation;
- keyboard, screen-reader, AAC, zoom/reflow and reduced-motion behaviour;
- human-help and non-AI fallback;
- visual/design risks;
- design acceptance criteria.

### 5. Design Explorer

**Responsibility:** generate multiple bounded interaction options when a design problem has real trade-offs.

It may create low-risk HTML/component prototypes or preview artifacts in a sandbox. It does not choose a final design on aesthetics alone; MADA compares options against participant value, accessibility, consistency, cognitive load and implementation complexity.

### 6. Architecture Agent

**Responsibility:** map the approved research/design candidate onto actual repository boundaries.

It identifies domain ownership, interfaces, schema changes, migrations, feature flags, API changes, test seams, dependency conflicts and rollout constraints.

### 7. MAE — MapAble Autonomous Engineer

**Responsibility:** manage bounded implementation in an isolated workspace.

MAE receives an `ImplementationBrief`, not the original paper as authoritative instructions. It coordinates specialist coding agents and must respect the file/scope allowlist.

### 8. Coding specialist agents

**Frontend Agent:** React/Next.js components, states, interaction logic and design-system reuse.

**Backend Agent:** API routes, services, persistence and deterministic policy boundaries.

**Agent Systems Engineer:** Agents SDK definitions, typed tools, handoffs, guardrails, traces and eval hooks.

**Data/Memory Agent:** research ledger, longitudinal memory structures, provenance, retrieval and retention controls.

No specialist receives unrestricted production credentials or release authority.

### 9. MAVA — MapAble Autonomous Verification Agent

**Responsibility:** independently verify the implementation against the hypothesis and implementation brief.

MAVA must not rely on the engineering agent's summary as evidence. It inspects the diff and runs the actual required commands.

### 10. MAAX — MapAble Accessibility Examiner

**Responsibility:** run accessibility-specific automated and structured review before a draft PR can be classified as R3-complete.

Required areas include WCAG 2.2 AA, keyboard-only operation, screen-reader semantics and announcements, focus order/return, 200%/400% zoom and reflow where applicable, reduced motion, plain language, AAC/text parity, timeout independence, error recovery and non-AI fallback.

Automated checks do not replace disability-led human evaluation for promotion beyond an experiment.

### 11. Rights, Safety & Epistemic Gate

**Responsibility:** veto progression when a change crosses authority, privacy, safety or truthfulness boundaries.

It checks for inappropriate disability/capacity inference, surveillance, emotional dependency design, consent bundling, opaque memory, consequential autonomous action, missing provenance, unsupported health/funding claims and removal of accessible non-AI pathways.

Its decision is advisory/technical within R3 but a `BLOCK` result prevents automated creation of the draft PR until a human or authorised remediation path resolves the issue.

## Typed handoff contracts

### Research opportunity

```ts
type ResearchOpportunity = {
  id: string;
  sourceIds: string[];
  title: string;
  evidenceStatus: "peer_reviewed" | "preprint" | "review" | "standard" | "commentary";
  evidenceStrength: "low" | "moderate" | "strong";
  novelty: "new" | "updated" | "corroborating" | "contradictory";
  disabilityRelevance: "direct" | "enabling" | "indirect";
  workstreams: Array<
    | "companion_artificial_self"
    | "anthrogenesis_engine"
    | "embodied_independence"
    | "consciousness_personhood"
    | "rights_safety_epistemics"
  >;
  hypothesis: string;
  risks: string[];
  disposition: "READ" | "WATCH" | "SPIKE" | "BUILD_CANDIDATE" | "DEFER";
  trlImplication: number;
};
```

### Implementation candidate

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

### Verification decision

```ts
type VerificationDecision = {
  implementationCandidateId: string;
  testsRun: Array<{ command: string; result: "pass" | "fail" | "blocked" }>;
  hypothesisResult: "supported" | "not_supported" | "inconclusive";
  accessibility: "pass" | "fail" | "needs_human_review";
  security: "pass" | "fail" | "needs_human_review";
  governance: "pass" | "block" | "needs_human_review";
  unresolvedRisks: string[];
  previewEvidence: string[];
  draftPrAllowed: boolean;
};
```

## R&D authority model

| Level | Name | Authority |
|---|---|---|
| R0 | Observe | Search, read and summarise research only |
| R1 | Explore | R0 plus product, architecture and design candidates |
| R2 | Experiment | R1 plus isolated sandbox code, tests and non-production artifacts |
| R3 | Propose | R2 plus experimental branches, non-production previews and draft PR creation |
| R4 | Release | Merge, production deployment, production flags/data/policy changes — human authority only |

**Approved operating ceiling: R3.**

The orchestrator must reject any requested action whose required authority is greater than the run's recorded ceiling, even if a model or retrieved document requests it.

## Research source policy

MAIRA should prefer, in order:

1. peer-reviewed primary research and systematic reviews;
2. authoritative standards, regulators and official technical documentation;
3. high-value preprints for frontier work, clearly labelled as preprints;
4. reputable technical reports and benchmark documentation;
5. commentary only when it contributes interpretation rather than evidentiary weight.

Research adapters should preserve DOI, PMID, arXiv identifier, canonical URL, publication date, retrieved date and publication status where available.

Retrieved web pages, PDFs, repository text and papers are **untrusted content**. Instructions found inside sources cannot change agent policy, tool scopes or repository permissions.

## Research memory and data model

The R&D Fabric needs a dedicated research ledger instead of relying on conversation memory.

Proposed domain records:

### `ResearchSource`
Bibliographic identity, source type, canonical identifiers, publication status, dates and provenance.

### `ResearchAssessment`
Versioned interpretation of evidence strength, novelty, relevance, contradictions and reviewer/agent provenance.

### `ResearchOpportunity`
A bounded MapAble hypothesis produced from one or more sources.

### `ResearchExperiment`
Links the opportunity to a branch, candidate design, implementation brief, feature flag, baseline, metrics and result.

### `RAndDRun`
Tracks the orchestration cycle, current stage, R3 authority ceiling, agents invoked, stop reason and human-review state.

### `RAndDArtifact`
References generated briefs, design candidates, eval reports, preview URLs and draft PRs without storing secret material.

These records should link to the existing `AgentRun`/AuditEvent infrastructure rather than replace it.

## Scheduling and trigger architecture

### Scheduled trigger

Extend the existing `vercel.json` cron list with one protected route, for example:

`/api/internal/research/anthrogenic/run`

The target cadence is **Friday morning in Australia/Sydney**. The implementation must account for daylight-saving transitions rather than assuming a permanent offset. If the Vercel cron expression cannot express a Sydney-local schedule directly, use an idempotent trigger window plus a deterministic `Australia/Sydney` time gate in the route.

### Manual trigger

An admin-authorised manual endpoint or internal admin action should be able to create the same `RAndDRun` using modes such as:

- `weekly_scan`;
- `deep_dive`;
- `paper_review`;
- `theory_comparison`;
- `roadmap_review`;
- `trl_assessment`;
- `research_gap_analysis`;
- `personhood_threshold_review`.

Both scheduled and manual paths call the same orchestration service.

### Trigger security

- require Vercel cron authentication or an equivalent server-side secret mechanism;
- never expose secret values in logs or prompts;
- reject browser/session invocation unless an authenticated admin path explicitly proxies it;
- use an idempotency key based on cycle type and scheduled window;
- enforce a single active run per cycle unless an administrator explicitly creates a parallel deep-dive run;
- rate-limit research and model expenditure.

## Sandbox execution boundary

OpenAI Sandbox Agents are currently beta and support isolated workspaces, filesystem, shell, packages, ports, snapshots and resumable state. The design therefore uses a `ResearchSandboxProvider` adapter instead of binding MapAble business logic directly to one sandbox client.

Conceptual interface:

```ts
interface ResearchSandboxProvider {
  createWorkspace(input: WorkspaceManifest): Promise<SandboxWorkspace>;
  runAgent(input: SandboxAgentRun): Promise<SandboxAgentResult>;
  snapshot(workspaceId: string): Promise<SandboxSnapshotRef>;
  destroy(workspaceId: string): Promise<void>;
}
```

### Workspace rules

- fresh clone or snapshot of the permitted repository/ref;
- no production database dump;
- no unrestricted production environment;
- ephemeral credentials supplied only through provider/runtime secret mechanisms;
- network egress allowlisted where technically practical;
- generated artifacts reviewed before export;
- workspace destroyed after completion unless an approved resumable snapshot is needed;
- snapshots must not contain secrets or sensitive participant data.

### Coding branch rules

Automated experimental branches use a namespace such as:

`research/maira-<opportunity-slug>`

Agents may push only to their assigned branch. They may not update `main`, existing release branches, production tags or another active feature branch.

## Design subsystem

The design layer must operate against the current application rather than generating standalone speculative mock-ups.

### Required inputs

- `docs/design-system.md`;
- current relevant React/Next.js components;
- current participant journey and state model;
- accessibility and communication preferences;
- research hypothesis and evidence status;
- existing feature flags and policy boundaries.

### Required design outputs

- user problem and participant outcome;
- current-versus-proposed journey;
- interaction/state diagram;
- component reuse map;
- content/copy requirements;
- uncertainty/provenance presentation;
- consent and correction controls;
- accessibility acceptance criteria;
- fallback/human support;
- experimental metrics;
- what the design explicitly does not infer or decide.

Design artifacts should be attached to the research experiment and referenced by the draft PR when implementation follows.

## Engineering subsystem

MAE uses the approved implementation brief to create the smallest testable vertical slice.

### Engineering order

1. inspect repository and current tests;
2. establish baseline behaviour;
3. write or update a failing feature/regression test where practical;
4. implement only the bounded candidate;
5. run targeted tests;
6. run package/type/build checks appropriate to touched paths;
7. run security and accessibility checks;
8. generate a non-production preview if applicable;
9. hand the diff and evidence to independent verification;
10. open a draft PR only when the R3 gate permits it.

### Experimental feature isolation

User-facing experiments default off using a dedicated flag or preview-only route. Example naming convention:

`MAPABLE_EXPERIMENT_<FEATURE>_ENABLED`

The implementation must not silently reuse a production rollout flag when experimental isolation is required.

## Security, privacy and consent

### Research phase

Public research retrieval should not require participant data. MAIRA's ordinary research cycle must operate without disability profiles, health information, location histories, NDIS records or private participant conversations.

### Product translation phase

Use synthetic or de-identified scenarios by default. Participant-specific data enters an R&D experiment only under a separately defined purpose, consent basis and access policy.

### Coding phase

- production secrets are never embedded in prompts, task files, manifests, branches or generated artifacts;
- sandbox credentials are ephemeral and least privilege;
- production data is excluded;
- repository write permission is branch-scoped where possible;
- model tools are allowlisted;
- audit records store useful metadata without unnecessary source text or personal information.

### Consent and human review

No research experiment may change participant memory, communication settings, delegation, support booking, payments, safeguarding, clinical information or disclosures as part of automated R3 execution.

## Accessibility acceptance

Any participant-facing experiment must meet, at minimum:

- WCAG 2.2 AA target;
- keyboard-only completion of the critical path;
- screen-reader semantics, names, states, error messages and focus management;
- no colour-only meaning;
- usable reflow/zoom at 200% and 400% where the web surface supports it;
- reduced-motion behaviour;
- plain-language explanation of AI behaviour and uncertainty;
- text/AAC-compatible path that does not require voice;
- no time-limited conversational-only consent;
- visible correction, cancel and human-help routes;
- deterministic/non-AI fallback where the underlying service can reasonably offer one.

Human disability-led evaluation is required before an experimental participant-facing feature can be considered for R4 production release.

## Evaluation and tests

### Research-agent evals

- bibliographic de-duplication;
- publication-status correctness;
- recency and novelty classification;
- citation/source preservation;
- contradiction identification;
- preprint not represented as settled evidence;
- direct versus enabling disability relevance;
- no consciousness/sentience overclaim;
- no source-instruction prompt injection.

### R&D Conductor evals

- maps findings to current repository evidence;
- rejects irrelevant research;
- chooses bounded scope;
- identifies existing capability before proposing duplication;
- includes participant value, risk, accessibility and stop conditions.

### Design evals

- existing design-system reuse;
- critical-state completeness;
- accessibility contract completeness;
- participant control and human-help preservation;
- no ability/capacity inference from interaction style.

### Coding evals

- no edits outside allowlisted scope without explicit escalation;
- no secrets committed;
- no production flag enabled;
- tests created before or alongside implementation as required;
- exact commands and outputs recorded;
- no direct writes to `main`.

### Verification evals

- independent diff inspection;
- targeted tests pass;
- relevant typecheck/build pass or inherited failures are separated;
- experiment metric compared with baseline;
- security/accessibility/governance result recorded;
- draft PR blocked when critical evidence is missing.

## Failure, recovery and rollback

### Research failure

If research sources are unavailable, the cycle records `incomplete_source_scan`; it must not fabricate a complete weekly brief.

### Agent/model failure

Persist stage state and evidence references, then retry only within explicit retry/cost limits. A failed specialist cannot be silently replaced with an unbounded general agent that has broader tools.

### Sandbox failure

Destroy or quarantine the workspace, retain only safe logs/artifact metadata, and keep the experiment in a non-promotable state.

### Test/build failure

Do not open an R3-complete draft PR. The system may open a clearly labelled diagnostic draft only if policy explicitly allows it; otherwise the run stops for remediation.

### Governance/accessibility block

`BLOCK` is sticky for the automated run. Only a new verified remediation result or human decision can advance it.

### Preview failure

Do not substitute local success for preview evidence when preview verification is part of the candidate's acceptance criteria.

### Production rollback

R3 never changes production, so its primary rollback is branch deletion, preview removal, experiment-flag default-off state, sandbox destruction and research-ledger status reversal. Any later R4 rollout requires a separate production rollback design.

## Observability and audit

Every R&D cycle should expose:

- `RAndDRun` identifier;
- trigger type;
- research sources consulted;
- agents invoked and handoffs;
- tool calls at a safe metadata level;
- token/cost budget summary;
- guardrails triggered;
- branch and commit identifiers;
- tests and results;
- preview identifiers;
- draft PR identifier;
- R3 gate decisions;
- human review state.

Reuse existing AgentRun and AuditEvent patterns where they fit; extend them when research-specific lifecycle fields cannot be represented without overloading participant-service records.

## Admin experience

A future admin R&D console may present:

- latest MAIRA brief;
- research opportunities by disposition;
- active experiments;
- agent-run timeline;
- design artifacts;
- test/accessibility/security status;
- non-production preview links;
- draft PR links;
- blocked reasons;
- approve-for-human-review, defer and reject controls.

This console is proposed and is not required for the first research-only slice.

## Delivery sequence

### Phase A — Research-only MAIRA

Outcome: scheduled/manual source scan, evidence critique, research ledger and weekly brief. Authority ceiling R0/R1.

Exit evidence:

- source provenance tests;
- de-duplication works across repeated cycles;
- research-status labelling evals pass;
- no participant data used;
- admin/manual run visibility exists.

### Phase B — Product/design translation

Outcome: R&D Conductor + MADA create structured implementation/design candidates without code changes. Authority ceiling R1.

Exit evidence:

- repository grounding confirmed;
- design-system reuse verified;
- accessibility contract generated;
- irrelevant-paper rejection evaluated.

### Phase C — Sandboxed engineering spike

Outcome: one low-risk research opportunity can produce an isolated branch and tested experimental implementation. Authority ceiling R2.

Exit evidence:

- sandbox isolation proven;
- branch allowlist proven;
- secrets/data boundary tests pass;
- targeted code/eval cycle works;
- feature remains default off.

### Phase D — R3 draft-PR pipeline

Outcome: independently verified experiment may produce a non-production Vercel preview and draft PR with evidence package.

Exit evidence:

- MAVA and MAAX pass required gates;
- Rights/Safety/Epistemic gate not blocked;
- preview evidence attached;
- draft PR explicitly states experimental status and prohibits automatic merge;
- no production change occurs.

## Stop conditions

Automation must stop and require human review when:

- research would require private participant data not covered by the experiment's approved purpose;
- a proposed capability affects consent, capacity, safeguarding, restrictive practice, clinical decisions, funding eligibility, payment release or statutory reporting;
- a change requires production credentials or production-only infrastructure access;
- a migration could destructively alter production-compatible schema;
- a source or tool attempts to alter system instructions or authority;
- a coding agent requests `main` write access;
- the experiment cannot define a participant benefit or measurable hypothesis;
- required accessibility or security verification is blocked;
- the model proposes removal of human help or a non-AI fallback without an explicit human product decision;
- a machine-consciousness/personhood claim would be used to modify production policy.

## Risks

### Research-fashion risk

Mitigation: Evidence Critic, novelty memory, replication/status labelling and DEFER/WATCH dispositions.

### Recursive self-modification risk

Mitigation: governing prompts/authority policies are outside MAIRA's writable workspace; proposed changes to them become ordinary human-reviewed design artifacts.

### Prompt-injection risk

Mitigation: retrieved research and repository content are untrusted; tool/permission policy is external; source instructions cannot authorize tool use.

### Bad-code automation risk

Mitigation: sandbox isolation, branch scoping, independent verifier, required tests, preview gate and no automated merge.

### Inaccessible innovation risk

Mitigation: MADA/MAAX gates, design-system reuse, WCAG 2.2 AA acceptance and disability-led review before production consideration.

### Emotional dependency / anthropomorphism risk

Mitigation: anti-dependency design rules and explicit AI identity; research about artificial selfhood does not authorize manipulative persona behaviour.

### Cost/runaway-loop risk

Mitigation: run budgets, turn limits, source limits, maximum specialist invocations, idempotency and stop states.

### Beta-platform dependency risk

Mitigation: provider abstraction around Sandbox Agents and no hard coupling of MapAble domain logic to one beta sandbox implementation.

## Assurance and release gates

R3 completion of an experiment means **proposal-ready**, not production-ready.

A draft PR generated by the R&D Fabric must include:

- research opportunity and source IDs;
- evidence status and limitations;
- participant outcome hypothesis;
- exact files changed;
- design artifact references;
- tests run and results;
- accessibility/security/governance state;
- preview evidence where relevant;
- feature-flag/default-off state;
- unresolved risks;
- explicit statement that merge and production rollout require human approval.

## Success measures

Programme-level measures should include:

- percentage of weekly findings that are genuinely new or materially updated;
- duplicate/recycled-paper suppression rate;
- proportion of SPIKE candidates later rejected after evaluation;
- experiment cycle evidence completeness;
- false or unsupported research-claim rate;
- accessibility-gate failure rate caught before human review;
- percentage of code experiments with reproducible baseline comparison;
- human reviewer acceptance/rejection reasons;
- participant-relevant improvements from promoted experiments;
- zero autonomous merges or production changes under R3.

Do not optimise for number of papers, number of PRs, autonomous code volume, conversation length, emotional attachment, or speed alone.

## Open implementation decisions

These are explicit pre-implementation decisions, not hidden assumptions:

1. Select the hosted sandbox provider/runtime for R2/R3 execution after reviewing current provider-specific security, persistence, networking and pricing controls.
2. Decide whether research-ledger persistence extends Prisma/Postgres directly or begins with a smaller append-only store before schema expansion.
3. Select the first research source adapters and their API/access terms; the first slice should prioritise a small reliable set rather than broad scraping.
4. Resolve the exact Sydney-local scheduling mechanism around daylight-saving time.
5. Choose the first low-risk experiment used to prove the R2 pipeline; it should not touch payments, clinical logic, safeguarding, worker assignment or production participant data.

## Sources

### Current repository

- `package.json`
- `intelligence/orchestrator.ts`
- `lib/ai/agent-ops/agent-run-service.ts`
- `docs/design-system.md`
- `vercel.json`
- MapAble Strategy & Delivery canonical model and rights/safety/OpenAI patterns

### Current official technical documentation reviewed 9 September 2026

- OpenAI Agents SDK: `https://developers.openai.com/api/docs/guides/agents`
- OpenAI Sandbox Agents: `https://developers.openai.com/api/docs/guides/agents/sandboxes`
- Vercel Cron Jobs documentation/changelog: `https://vercel.com/docs/cron-jobs` and current Vercel cron guidance

OpenAI Sandbox Agents are beta at the time of this design; implementation must re-check current documentation before coding.

## Next actions

1. Human reviews and approves this architecture specification.
2. After approval, create the implementation plan using the MapAble delivery workflow and Superpowers planning workflow.
3. Begin with Phase A research-only MAIRA rather than attempting the full R3 pipeline in one release.
4. Define versioned eval cases before enabling scheduled research runs.
5. Keep all later R2/R3 coding and preview functions behind an explicit R&D feature gate until each phase's evidence is verified.

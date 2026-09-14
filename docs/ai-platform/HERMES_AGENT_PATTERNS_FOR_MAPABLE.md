# Hermes Agent and AI-SDK Convergence Lessons for MapAble

**Date:** 2026-09-14  
**Status:** Architecture research note  
**Applies to:** Agentic Nerve Centre, ACSS, Sentinel, Care, Transport, Jobs/Employment, developer-agent workflows  
**Production impact:** None; no flags or runtime behavior changed

## Sources reviewed

1. Salman Quazi, **“SDKs, Frameworks, Agents: Pick Your Tier”** (30 March 2026): https://www.salmanq.com/blog/demystifying-ai-sdks/
2. Nous Research, **Hermes Agent**: https://hermes-agent.nousresearch.com/
3. Nous Research, **Hermes Agent architecture/security/skills/memory documentation**.
4. NousResearch/hermes-agent GitHub repository: https://github.com/NousResearch/hermes-agent

## Decision

MapAble should deliberately separate three different AI layers rather than allow them to blur into one autonomous runtime.

```text
TIER 3 — DEVELOPMENT AGENTS
Codex / Cursor / ChatGPT Work / optional Hermes-style engineering agent
Builds, tests, reviews and proposes MapAble code.
NO live participant-service authority.

TIER 2 — MAPABLE AGENT FRAMEWORK
Mission Runtime + Context Fabric + Guardian + Recovery + Sentinel profiles
+ Human Operations + Action Kernel + Connector Gateway.
Coordinates bounded product intelligence.

TIER 1 — MODEL / API PROVIDERS
OpenAI or other approved models behind the canonical Model Gateway.
No direct provider SDK calls from Care, Transport or Jobs domain modules.
```

This follows the article's useful distinction: SDKs call models, frameworks coordinate model/tool workflows, and coding agents close the engineering feedback loop by operating on the development environment. The important MapAble adaptation is that Tier 3 autonomy belongs in software development and assurance, not participant-facing care, transport, employment, funding or safeguarding execution.

## Evidence-derived Hermes patterns worth adopting

### 1. One platform-agnostic core, multiple surfaces

Hermes uses one core `AIAgent` loop across CLI, gateway, ACP, batch and API entry points. Platform-specific behavior lives at the edges.

**MapAble adaptation:** Keep one canonical intelligence/control plane in `lib/ai/platform`. Ask MapAble, Companion, Care, Transport, Jobs and future mobile surfaces consume the same governed contracts. Do not create a separate CareGPT/JobsGPT/Sentinel brain.

### 2. Provider abstraction

Hermes resolves providers/models through a shared runtime layer and supports multiple providers without changing application logic.

**MapAble adaptation:** Continue to route all model use through the canonical Model Gateway. Domain modules must not import provider SDKs directly. Provider substitution must not alter authority or policy behavior.

### 3. Tool registry and bounded toolsets

Hermes centralizes tools in a registry and groups them into toolsets.

**MapAble adaptation:** Treat MapAble capabilities/actions/connectors as typed capabilities with explicit purpose, input schema, output schema, authority ceiling, data classes, required consent/role, and audit semantics. Sentinel profiles consume these capabilities; they do not gain general-purpose tool access.

### 4. Progressive-disclosure skills

Hermes skills expose a small metadata index first and load full procedures only when needed.

**MapAble adaptation:** Use progressive disclosure for policy/procedure/context packs. Keep baseline prompts small. Load Care, Transport, Jobs, NDIS, accessibility or recovery instructions only for the active mission purpose. Rights/safety rules that must always apply remain deterministic code, not optional skills.

### 5. Observable and interruptible execution

Hermes makes tool calls visible and supports interruption while work is running.

**MapAble adaptation:** Every consequential MapAble workflow must expose participant-safe status: what is happening, facts vs unknowns, why it paused, what will happen next, and how to Stop / Change / Ask a person. Interruptibility is a participant-control requirement, not merely a developer UX feature.

### 6. Parallel subagents / advisors

Hermes can delegate parallel work and also supports Mixture of Agents: reference models advise while one aggregator remains the acting model.

**MapAble adaptation:** Multi-model or multi-agent reasoning may be useful for complex evidence synthesis, option generation, accessibility interpretation, or policy research. Advisors must remain non-authoritative. Their outputs are evidence-labelled suggestions passed to the canonical acting model and then to deterministic Guardian/policy gates.

No reference model receives broader participant data merely because it is an advisor. Minimum-necessary context applies per model call.

### 7. Bounded persistent memory

Hermes separates compact always-on memory from longer procedural skills and constrains memory size.

**MapAble adaptation:** Prefer participant-controlled Agency Memory over unlimited conversation memory. Store small, explicit, purpose-relevant preferences/decisions; keep operational records in canonical systems of record. Model inference must never silently become participant preference, consent, capacity, risk level or employability information.

### 8. Learning loop with staged writes

Hermes can create/update skills and memory after successful or corrected workflows, and supports approval gates that stage those writes before they affect future sessions.

**MapAble adaptation:** Introduce a **Learning Proposal** pattern, not live self-modification:

```text
observed repeated workflow / correction / failure
  -> proposed learning
  -> provenance + reason + affected scope
  -> synthetic evaluation
  -> authorised human/participant review where relevant
  -> versioned publication
  -> rollbackable activation
```

Learning may improve explanation templates, workflow hints, retrieval strategies, test cases, option-generation heuristics and developer skills.

Learning must never autonomously modify:
- rights rules;
- safeguarding/reportability policy;
- consent/authority policy;
- worker/driver credential requirements;
- restrictive-practice policy;
- funding/payment/claim rules;
- employment fairness/disclosure rules;
- emergency/clinical boundaries;
- production feature flags.

### 9. Security floor below ordinary approvals

Hermes distinguishes ordinary approval flows from always-on hardline blocks.

**MapAble adaptation:** Preserve non-bypassable hard safety/rights invariants below any participant/admin/model approval layer. An authorised user cannot toggle the platform into a generic “YOLO” state for participant-impacting actions.

Examples of non-bypassable runtime floors:
- no AI decision on incident reportability or abuse substantiation;
- no autonomous restrictive-practice authorisation;
- no autonomous worker assignment or transport replacement selection;
- no autonomous employer disability disclosure or candidate rejection;
- no model-created consent or authority;
- no direct agent payment/claim approval;
- no cross-tenant participant-data access.

### 10. Fail-closed background automation

Hermes cron can deny dangerous actions in headless operation.

**MapAble adaptation:** Background watches may detect, refresh, reassess, alert, prepare recovery alternatives and create review work. If they reach a consequential participant decision or privileged write, they stop at the Guardian / participant / human / Action Kernel boundary.

## Patterns MapAble should NOT copy directly

### A. General-purpose autonomous terminal/tool access in participant runtime

Hermes is a personal/general-purpose agent and can intentionally operate shells, files, browsers and remote environments. MapAble operational agents should expose only narrow domain tools and connectors.

### B. “YOLO” or approval-off modes

Hermes permits approval bypass for trusted development environments while retaining a hardline blocklist. MapAble must not offer an equivalent bypass for live Care, Transport, Employment, safeguarding, consent, funding or health-impacting workflows.

Development sandboxes may use broader autonomy only with synthetic/de-identified data and no production credentials.

### C. Model-based approval as the safety authority

Hermes may use an auxiliary LLM to classify low-risk terminal commands. MapAble must keep high-impact permission and rights decisions deterministic. Models can classify or signal; policy code decides.

### D. Automatic user profiling as a default

Hermes can proactively save user profile information. MapAble's participant context is more sensitive. Participant-confirmed preference/agency memory should be the default; derived disability, capacity, motivation, compliance, employability or risk profiles are prohibited unless a separately lawful, explicit use case exists.

### E. Runtime self-modification of governance skills

Hermes can modify skills as procedural memory. MapAble must stage and review governance-affecting changes; production policy cannot self-edit from conversations.

## Care Sentinel implications

Care parallel development should adopt:
- capability/tool manifests rather than broad agent access;
- observable/interruptible supervisory status;
- progressive loading of Care-specific context;
- recovery advisors that generate alternatives but cannot assign workers;
- learning proposals from repeated recovery failures, never live credential-rule changes.

Care must continue to reuse canonical worker eligibility and assignment services.

## Jobs / Employment Sentinel implications

Employment parallel development should adopt:
- stage-scoped tools and disclosure context;
- participant-controlled memory for disclosure/interaction preferences;
- advisor models only for explanation/options, never employability scoring;
- full provenance on employer-facing drafts;
- no background learning that broadens disclosure scope;
- cross-domain dependency signals that do not reveal Care/Transport disability details.

## Mixture-of-Agents recommendation

Hermes' advisor/aggregator pattern is useful but should be optional and rare in MapAble.

Recommended MapAble pattern:

```text
minimal purpose-scoped evidence
   -> zero or more advisory models (no tools, no authority)
   -> acting model synthesises structured proposal
   -> deterministic Guardian / fairness / consent checks
   -> participant or authorised human decision if consequential
   -> Action Kernel
```

Use only when evaluation shows material quality improvement over a single model. Cost, latency, privacy exposure and inconsistency all increase with additional model calls.

For sensitive Care/Jobs data, privacy redaction should be **full by default**, not opt-in.

## Development-agent recommendation

Hermes is most immediately relevant to MapAble as a **developer-agent pattern**, not as the Care/Jobs runtime.

A future MapAble engineering agent could:
- open isolated worktrees;
- read project context and approved skills;
- implement TDD tasks;
- run tests/type-check/lint/security checks;
- dispatch parallel Care and Jobs implementation agents;
- prepare PRs;
- learn reusable engineering procedures through staged skill proposals;
- remain unable to merge/deploy/alter production secrets without explicit approval.

This aligns with the current ChatGPT/Cursor/GitHub development bridge and reduces manual typing burden without increasing participant-facing operational autonomy.

## Implementation consequence for Sentinel PR #593

No architecture reversal is required. These sources **reinforce** the convergence correction:

- keep Sentinel thin;
- keep one canonical AI platform;
- keep domain services as systems of record;
- keep provider abstraction behind Model Gateway;
- use parallel agents for development/advisory work, not autonomous participant decisions;
- make observable interruptibility a core UX property;
- introduce future Learning Proposals only through review/evaluation;
- retain a non-bypassable rights/safety floor.

The Care and Employment parallel slices may proceed independently under their existing ownership boundaries.

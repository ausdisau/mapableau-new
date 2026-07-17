# Wave 10 participant Agent OS (Phase 33)

Phase 33 documentation index for MapAble AURA — the participant-controlled,
bounded agent operating system introduced in Wave 10.

## Phase 33 disclaimers

- **AURA is not sentient or conscious.** AURA is bounded software, not a mind or legal person.
- **AURA has no independent legal authority.** AURA cannot sign, consent, or bind participants.
- **AURA does not replace the participant or decide legal capacity.** Supported decision-making stays with people and Wave 9 delegation.
- **AURA cannot create its own permissions.** Authority is fixed by envelopes and policy; AURA cannot self-escalate.
- **Model suggestions are not approvals.** Proposals require human confirmation where policy demands it.
- **Tool availability is not authority.** A registered tool does not imply permission to use it.
- **Consent and authority are checked at execution time.** Every mutation re-validates tenant, consent, and envelopes.
- **Participants can pause AURA and request a human** at any time.
- **Optional memory is participant controlled.** Memory is opt-in, scoped, and erasable.
- **Hidden chain of thought is not stored.** Internal reasoning traces are not persisted or disclosed.
- **MCP and A2A are interoperability adapters.** They transport tool calls; they do not grant trust.
- **External agents are not inherently trusted.** Federation requires explicit policy and disclosure.
- **Task completion ≠ participant benefit.** Success metrics must be calibrated to outcomes, not automation counts.
- **AI management mappings are not certification.** Control mappings document intent; they are not accreditation.
- **High-risk/regulated decisions remain human.** Medical, financial, legal, and safeguarding decisions stay with people.
- **Prohibited actions.** No AI may approve claims/invoices/payments, alter consent, establish legal delegation, determine reportability, close safeguarding, activate production integrations, or expand its own authority.

See also: `docs/aura/wave-10-not-sentient.md`, `docs/aura/wave-10-prohibited-actions.md`.


## Phase 33 documents

- [`agent-domain.md`](./agent-domain.md) — Agent domain model
- [`agent-manifests.md`](./agent-manifests.md) — Agent manifests
- [`authority-envelopes.md`](./authority-envelopes.md) — Authority envelopes
- [`action-risk-registry.md`](./action-risk-registry.md) — Action risk registry
- [`goal-understanding.md`](./goal-understanding.md) — Goal understanding
- [`plan-graphs.md`](./plan-graphs.md) — Plan graphs
- [`plan-simulation.md`](./plan-simulation.md) — Plan simulation
- [`approval-choreography.md`](./approval-choreography.md) — Approval choreography
- [`execution-state-machine.md`](./execution-state-machine.md) — Execution state machine
- [`tool-registry.md`](./tool-registry.md) — Tool registry
- [`mcp-profile.md`](./mcp-profile.md) — MCP profile
- [`a2a-profile.md`](./a2a-profile.md) — A2A profile
- [`participant-memory.md`](./participant-memory.md) — Participant memory
- [`accessible-interaction.md`](./accessible-interaction.md) — Accessible interaction
- [`specialist-agents.md`](./specialist-agents.md) — Specialist agents
- [`agent-handoffs.md`](./agent-handoffs.md) — Agent handoffs
- [`reversibility-and-compensation.md`](./reversibility-and-compensation.md) — Reversibility and compensation
- [`safety-interlocks.md`](./safety-interlocks.md) — Safety interlocks
- [`prompt-injection-defence.md`](./prompt-injection-defence.md) — Prompt injection defence
- [`model-registry.md`](./model-registry.md) — Model registry
- [`prompt-governance.md`](./prompt-governance.md) — Prompt governance
- [`ai-assurance.md`](./ai-assurance.md) — AI assurance
- [`agent-evaluation.md`](./agent-evaluation.md) — Agent evaluation
- [`fairness.md`](./fairness.md) — Fairness
- [`outcome-calibration.md`](./outcome-calibration.md) — Outcome calibration
- [`agent-observability.md`](./agent-observability.md) — Agent observability
- [`incident-response.md`](./incident-response.md) — Incident response
- [`wave-10-migration-runbook.md`](./wave-10-migration-runbook.md) — Migration runbook

## Foundational Wave 10 pack

- [`wave-10-architecture-and-risk-plan.md`](./wave-10-architecture-and-risk-plan.md)
- [`wave-10-agent-os.md`](./wave-10-agent-os.md)
- [`wave-10-not-sentient.md`](./wave-10-not-sentient.md)
- [`wave-10-prohibited-actions.md`](./wave-10-prohibited-actions.md)

## Audit scripts

Pack-root wrappers delegate to `scripts/aura/*`:

- `scripts/audit-ai-actions.ts`
- `scripts/audit-automation-events.ts`
- `scripts/audit-tool-registry.ts`
- `scripts/audit-ai-tenant-scope.ts`
- `scripts/audit-ai-consent.ts`
- `scripts/migrate-ai-matching-runs.ts`
- `scripts/backfill-agent-definitions.ts`
- `scripts/classify-agent-actions.ts`
- `scripts/audit-agent-memory.ts`
- `scripts/audit-agent-bypasses.ts`

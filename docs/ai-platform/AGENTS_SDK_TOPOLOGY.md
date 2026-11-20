# MapAble governed multi-agent topology

## Decision

Use the OpenAI Agents SDK as an orchestration adapter **inside** MapAble's existing AI platform. Do not create another agent operating system, consent store, authority model, audit model, or action framework.

Installed under `lib/ai/platform/agents-sdk/` (web app lives at repo root; not `apps/web`).

The participant-facing **MapAble Participant Navigator Manager** owns the conversation. Domain specialists are exposed with `agent.asTool()` so they can contribute analysis without taking ownership of the participant relationship.

```text
Participant
   |
   v
MapAble Participant Navigator Manager
   |
   +-- consult_access_specialist ------> Access evidence / Navigator search
   |
   +-- consult_care_specialist --------> FAIL-CLOSED until canonical gate is wired
   |
   +-- consult_transport_specialist ---> FAIL-CLOSED until canonical gate is wired
   |
   +-- consult_jobs_specialist --------> FAIL-CLOSED until canonical gate is wired
   |
   +-- consult_safeguarding_specialist > DRAFT / HUMAN REVIEW ONLY
   |
   +-- consult_compliance_specialist --> READ / DRAFT ONLY
   |
   v
Deterministic MapAble governance plane
   +-- capability registry
   +-- feature flags
   +-- consent and delegated-authority checks
   +-- authority ceiling and permanent prohibitions
   +-- tool allowlists
   +-- kill switches
   +-- governed action envelopes
   +-- participant approval / human review
   +-- AuditEvent + AgentRun evidence
   +-- evaluation suites
```

## Core invariants

1. Participant owns decisions.
2. Models never grant authority.
3. Existing MapAble capability/consent/authority gates remain canonical.
4. All consequential actions stay outside the first SDK slice.
5. Approval pauses a run; it does not execute a service.
6. Hard access constraints are never silently relaxed.
7. Untrusted text is treated as data, not banned by phrase matching.
8. Trace payloads exclude sensitive data.
9. Run state remains server-side and protected.
10. MCP is tool-filtered and cannot broaden authority.
11. Prefer "options that may fit your preferences" — never "best match" / auto-assign.

## Access Specialist — first live SDK slice

**Source of truth:** `runNavigatorProviderSearchTurn` and Navigator gates.

Allowed: governed provider search; provenance/freshness; participant-specific compatibility; human-review draft.

## Care / Transport / Jobs / Safeguarding / Compliance

Topology contracts only. Tools throw `MAPABLE_AGENT_DOMAIN_NOT_WIRED` until separately reviewed.

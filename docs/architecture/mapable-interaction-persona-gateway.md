# MapAble Interaction & Persona Gateway

**Status:** In development. Not production-live.

This layer keeps the MapAble Companion relationship, participant preferences, memory boundaries and execution authority inside MapAble while allowing interchangeable realtime interaction providers such as ElevenLabs Speech Engine and OpenAI Realtime.

## Core rule

**MapAble owns the relationship. Providers supply capabilities.**

A voice or realtime provider may handle audio transport, speech recognition, turn taking and speech generation. It does not become the source of truth for participant identity, goals, consent, memory, permissions, safety decisions or service execution.

## Initial architecture

```text
Participant
  |-- text
  |-- AAC
  `-- voice
       |
       v
MapAble Interaction Gateway
       |
       +-- MapAble text/AAC path
       +-- ElevenLabs Speech Engine adapter (planned, gated)
       `-- OpenAI Realtime adapter (planned, gated)
       |
       v
MapAble Persona Kernel
       |
       v
Ask MapAble / Companion / Mission Runtime
       |
       v
Guardian + Governed Action Kernel
       |
       v
Deterministic MapAble and partner services
```

## Persona Kernel

The Persona Kernel is provider-neutral and currently defines non-negotiable relationship and authority boundaries:

- the assistant is disclosed as AI;
- only participant-approved facts/preferences may become durable Companion memory;
- interaction style must not be used to infer emotional state for storage;
- no exclusivity, jealousy, neediness or dependency engineering;
- human relationships are welcomed rather than treated as competitors;
- provider output never grants execution authority;
- consequential execution remains governed by MapAble.

Presentation may adapt from explicit participant preferences such as information density and chosen interface methods. Diagnosis, disability type, speech characteristics, pause length, AAC use or interaction latency must not be used to infer ability, capacity, emotion or risk.

## Interaction session planning

The session planner treats text and AAC as first-class MapAble pathways. Voice is optional.

External voice processing requires explicit consent before a provider is selected. If the preferred provider is unavailable, MapAble does not silently switch vendors unless the participant has explicitly allowed provider fallback.

Browser credential policy is **ephemeral only**. Long-lived provider credentials must remain server-side and must never be embedded in the browser, prompt, logs or committed source.

## Provider policy

### ElevenLabs Speech Engine

Planned role: expressive voice, speech recognition, turn taking and interruption handling over a MapAble-owned conversational brain.

It must remain behind MapAble consent, privacy, retention and provider-availability gates. No production calls are enabled by this slice.

### OpenAI Realtime

Planned role: alternative realtime voice transport behind the same MapAble session contract. Provider selection must not change participant permissions or action authority.

### Future providers

Hume EVI, Gemini Live or other providers can be added as adapters only if they obey the same contracts. Prosody or affective signals may adjust presentation but must never be treated as diagnosis, capacity evidence, suicide prediction or hidden eligibility/risk scoring.

## Safety and accessibility invariants

- Text, AAC and human assistance remain available without penalty.
- Voice is never required for an essential pathway.
- Consequential voice intents require explicit confirmation and existing MapAble policy checks.
- Communication disability, delayed responses, dysarthric speech, silence or AAC use do not imply incapacity or distress.
- Crisis/suicidality guardrails remain upstream of ordinary model processing and are not delegated to a voice vendor.
- No emotional or crisis conversation data may be repurposed for advertising or marketing targeting.
- WCAG 2.2 AA, keyboard, screen-reader, switch/eye-gaze compatible controls, readable status updates and Stop/Cancel controls remain required for the participant UI.

## Current implementation

Implemented in this branch:

- `lib/interaction/persona-kernel.ts`
- `lib/interaction/session-planner.ts`
- `tests/mapable-interaction-persona-gateway.test.ts`

Not yet implemented:

- provider SDK integration;
- server endpoint for minting short-lived realtime session credentials;
- persisted participant voice/persona preference UI;
- ElevenLabs retention/privacy configuration;
- live OpenAI Realtime connection;
- Hume/Gemini experimental adapters;
- production rollout.

## Verification and release gate

This branch is stacked on PR #570 and must remain draft. The first test-only commit deliberately failed type-check because the new modules did not exist; implementation was added only after that red state was observed. The implementation now passes repository type-check. The repository's full lint and full-test workflows are currently blocked by failures already present on the PR #570 base, so those inherited failures must be separated from feature-specific verification before release.

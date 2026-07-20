# Operations — PBS AI assistance

## Default engine

- Implementation: `DeterministicPbsAssistanceEngine`
- Provider: `deterministic_local` / model `rules-v1`
- Ceiling: `DRAFT_ONLY`
- Flag: `MAPABLE_PBS_AI_ASSISTANCE_ENABLED` (default false)

## Permitted actions

Identify unanswered sections; draft neutral follow-ups; organise practitioner-approved evidence; consultation checklists; plain-language summaries; draft section scaffolding; label contradictions unresolved; map reviewed content to template.

## Prohibited

Diagnose; determine behaviour function; infer trauma/capacity/readiness; resolve safeguarding; recommend/approve/authorise/activate restrictive practices; finalise plans; write canonical clinical determinations.

## External model

`MAPABLE_PBS_EXTERNAL_MODEL_ENABLED` defaults false. If enabled later:

- Structured allowlist only
- No names, DOB, NDIS numbers, addresses, contacts, provider names, or raw records
- Free text only after exact-payload de-identification approval
- Display exact payload before approval
- Stable placeholders (`{{PARTICIPANT}}`)
- Record input/output hashes; never log content
- Reject missing placeholders, unsupported facts, RP instructions
- Sentence-level provenance + human acceptance required

## Audit

AI runs store provider/model/prompt version, hashes, timestamps, authority ceiling, reviewer, unknowns, conflicts — not chain-of-thought or raw external prompts. Clinical text must not appear in `AuditEvent.metadata`.

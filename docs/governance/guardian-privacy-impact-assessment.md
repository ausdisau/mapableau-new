# Guardian — Privacy Impact Assessment

**Status:** `DOCUMENTED_INTENT`  
**Not** APP compliance certification.

## Personal information involved

- Participant identifiers (scoped server-side)
- Support / health-sensitive context when purpose-authorised
- Complaint / safeguarding narratives (participant-provided)
- Model inferences (treated as personal information with `model_inference` provenance)

## Purposes

Declared Guardian purposes only (see purpose policy). No direct marketing reuse.

## Lawful basis / consent

Server-side consent and authority checks; fail closed on missing or revoked scopes.

## Overseas disclosure

APPROVED_EXTERNAL only via approved processing-provider registry + flags.

## Retention

Audit refs preferred over raw prompts/narratives/images. Retention categories TBD with privacy owner.

## Access / correction

Phase 7 participant pathway (“Why MapAble handled this this way”) — not yet shipped.

## Status of controls

| Control | Assurance |
|---------|-----------|
| Purpose / consent gate | `IMPLEMENTED_CONTROL` (flags off) |
| Zone routing | `IMPLEMENTED_CONTROL` (flags off) |
| Participant challenge UI | `DOCUMENTED_INTENT` |
| Processor due diligence | `DESIGNED_CONTROL` (in-code registry seed) |

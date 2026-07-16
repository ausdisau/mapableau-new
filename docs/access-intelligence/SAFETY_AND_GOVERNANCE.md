# Access Intelligence — Safety and Governance

## No diagnosis inference

Access Passports record **functional requirements** only. The agent must never infer requirements from a diagnosis, disability label, or medical term. Templates (e.g. “Power-chair access”) are editable starting points and do not assert uniform needs.

## Unknown-state handling

Missing evidence yields **unknown**, not “inaccessible”. The UI label is “Information incomplete”. Unknowns are never silently upgraded to confirmed facts by the language model.

## Consent model

Sharing is **field-specific** and **purpose-specific**. Write tools (`requestVenueVerification`, `submitBarrierReport`, `shareAccessPassport`) require explicit approval showing recipient, purpose, fields/questions, and duration when applicable.

## Evidence hierarchy

Approximate reliability defaults:

1. qualified_assessor (1.00)
2. system_feed (0.95)
3. trusted_partner (0.88)
4. trained_mapper (0.82)
5. venue_attestation (0.75)
6. community_report (0.55)
7. ai_inference (0.25)

AI inference is never presented as a measured evidence item.

## Dispute handling

Disputed or conflicting feature values lower confidence and produce unknowns for required matches. Moderators / human assessors resolve disputes outside the agent loop.

## Legal-compliance disclaimer

Access Intelligence provides **access information and planning support**. It does **not** certify DDA, Premises Standards, Australian Standards, NDIS, or other legal compliance.

## Emergency-routing limitation

Recommended accessible routes are for **ordinary visit planning**. They are **not** approved emergency evacuation routes. Contingency copy states this explicitly.

## AI inference labelling

Any `sourceType: ai_inference` must be labelled as inference. Visual estimation from photos is not a verified measurement without calibrated references and validation.

## Moderation requirements for reports

Community barrier reports are staged via approval, audited, and should enter a moderation queue before public display in production.

## Human assessor role

Qualified assessors remain the highest-trust measurement source. Venue attestations and community reports are provisional until corroborated.

## Logging

Do not log passport contents, full addresses, health notes, or raw chat by default. Prefer error codes and non-sensitive identifiers.

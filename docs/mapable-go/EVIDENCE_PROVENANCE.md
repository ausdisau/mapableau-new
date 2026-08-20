# MapAble Go — Evidence & Provenance

**Claim state:** IN_DEVELOPMENT

MapAble Go surfaces material from Access Graph provenance rules:

- `community_reported`, `assessor_measured`, `ai_inferred`, `independently_verified`, etc.
- AI-inferred never silently becomes human verified (`assertAiCannotBeVerified`)
- Route segments show confidence, evidence coverage, and unknown segment counts

Barrier reports default to `community_reported` until verification.

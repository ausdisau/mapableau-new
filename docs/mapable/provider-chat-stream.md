# MapAble provider chat streaming and consented matching profiles

**Status:** Implemented in GitHub draft PR #628, based on map PR #627; **not deployed or independently verified in production**. Do not advertise as live or screened-worker search.

## Current implementation

- App: /provider-finder/service-map. Client components: ProviderChatStream and ProviderSearchProfileForm.
- APIs: POST /api/providers/chat-search (authenticated streaming NDJSON); GET/PUT/DELETE /api/providers/search-profile (owner-only profile; feature gated).
- Uses MapAble's existing NextAuth session and Prisma / Neon datasource; it does not create a new auth provider or database service.
- Chat output is a progressive list of imported provider *organisation* records, streamed one at a time and mirrored on the MapLibre map when coordinates exist.
- Language parsing is deterministic; no LLM or external AI receives user queries or profiles.
- Service vocabulary matches source text arrays ndis_providers.services and ndis_providers.registration_groups using parameterised database-side SQL. Group matches do not certify competence or availability.

## User control and consent

- **Per-search:** User explicitly chooses to apply temporary filters, a saved profile, both or neither. Message-specific geography and service take precedence over saved filters.
- **Persisted data:** Only broad optional state, postcode, suburb, typed service categories, AAC/Text/Auslan preference, typed functional access requirements, delivery preference and funding management preference. No diagnosis, clinical notes, NDIS number, precise home address, location history, contacts or chat transcripts.
- **Encryption:** AES-256-GCM using dedicated MapAble data-encryption key with purpose-bound additional authenticated data. Missing or invalid keys fail closed. Key rotation requires explicit reviewed migration.
- **Consent:** Explicit and versioned; save/edit renews consent and records an audit event with no profile values. Deletion physically removes the ciphertext and leaves a content-free withdrawal audit event. No provider sharing, ad targeting, cross-module inheritance or implicit use of AccessibilityProfile.
- **Owner access:** Server always derives user ID from authenticated session, not request-provided participant ID. No delegation or organisation-wide access.
- **Export:** Users can read/export their own JSON preference values.
- **Security:** Mutations require same-origin Origin header. Process-local rate limiter is **not distributed or production-grade**; replace or verify before release.

## Feature gate / migration

MAPABLE_PROVIDER_SEARCH_PROFILE_ENABLED is **false** by default and must remain disabled until:

1. Review and rehearse prisma/migrations/20261030110000_provider_search_profile/migration.sql on a safe development database; generate Prisma client.
2. Validate migrations, rollbacks, backup/restore, key management, deletion and privacy data mapping.
3. Configure and test a **distributed** per-user rate limiter, audit visibility, CSRF Origin contract and trusted reverse proxies.
4. Test tenant/account isolation, corrupt ciphertext, accessibility, data export/deletion and retention.
5. Obtain human release approval.

Neon production was inspected **read-only**; no migration or data write was performed.

## Matching and evidence boundaries

Read-only Neon inspection on 30 October 2026:
- ndis_providers contains 20,200 imported directory records, 16,189 with non-null latitude/longitude.
- 2,822 records listed Support Coordination in registration_groups.
These are imported directory counts, **not** verified current registration, workers or vacancies.

Matching requires real source service labels/registration groups and optional state/postcode/suburb criteria. Unknown communication fit, home visits, complex clinical competence, availability, funding eligibility and NDIS registration remain **NEEDS CONFIRMATION**. Suburb filtering is not a distance or service-area lookup.

Provider registration is checked separately against NDIS Commission Provider Register. Individual worker clearance needs an authorised NWSD or State/Territory Worker Screening Unit result; provider registration is never worker-level evidence. No WorkerProfile records are published by this feature, though MapAble has internal worker models.

## Limits and acceptance checks

- Streaming uses NDJSON, not token-by-token LLM text. Up to 12 imported provider records returned with hasMore marker; real pagination and distance ranking remain future work.
- Browser NextAuth cookies required. Mobile needs a separately reviewed bearer-auth/session bridge and cross-platform stream adapter; never distribute cookies or DB credentials to React Native.
- Unit tests: pnpm vitest run tests/provider-finder/provider-chat-matching.test.ts tests/provider-finder/provider-search-origin.test.ts tests/security/provider-search-preferences.test.ts
- Before rollout verify 401/403/409/429/503, CSRF and per-user scoping, consent revocation, assistive technology, no-match, empty/error states, map-pin framing, staged migration and monitored security.
- Shared MapLibreMap has an opt-in fitToProviders prop; existing map uses stay unaffected.

**No live worker lookup, NWSD authorisation, provider regulatory-status check, production database write or deployment is included.**

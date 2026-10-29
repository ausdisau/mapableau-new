# MapAble provider and worker streaming discovery

**Status:** Draft implementation; unmerged, undeployed, no live safety assurance.  
**Related:** draft map PR #627; chat discovery is a stacked branch.  
**Existing identity:** NextAuth v4 / MapAble User (do not migrate accounts to Neon Auth).

## Purpose

A participant can describe their desired support naturally, see streamed provider-directory and consented worker profiles, and, if signed in, choose to use narrowly scoped saved search preferences. The participant owns the decision. These are discovery aids, never automated hiring, support booking, worker suitability certification, or provider endorsement.

## Components

| Component | Owner | Boundary |
| --- | --- | --- |
| Next.js `/api/provider-finder/chat` | Existing conversational interpreter and AI SDK 6 UI stream | Search suggestions, structured results; no authorisation from LLM |
| `lib/provider/finder/personalisation/discovery.ts` | Deterministic discovery layer | Only imported provider rows and opted-in worker profiles |
| `provider_finder_preferences` | Existing MapAble user identity in Neon/Postgres | Optional, revocable, broad location/service/language; no health record import |
| `worker_directory_publications` | Linked WorkerProfile owner | Default unpublished, explicit owner permission, revocable |
| `GuidedSearchDialogue` | React/Next.js | Real-time result event cards, list alternative, accessible scope controls |
| `/provider-finder/service-map` | Existing MapLibre/OSM map | NDIS directory pins, not plotted worker homes or locations |
| `apps/places` | React Native / Expo | Safe link to existing authenticated web finder; native auth remains out of scope |

The API streams `data-finderDiscoveryMeta` and `data-finderDiscoveryMatch` using the existing AI SDK UI stream; each event is display-ready and has exact source and evidence cautions. Natural-language interpretation can use existing configured AI, but AI never grants access or creates a credential status. The optional preferences are applied in deterministic ranking, **not appended to a model prompt**. No participant addresses, encrypted NDIS number, health details or diagnosis are loaded.

## Enablement and deployment order

1. Review source and CI on the stacked PR. Do not merge until worker publication, NextAuth, privacy and a11y reviews pass.
2. Preview the additive Prisma migration `20261030113000_provider_finder_consent_personalisation` in an isolated Neon Postgres branch using a direct, non-pooled database connection. Check actual Prisma schema status and migration collisions. **No production schema changes are authorised by this PR.**
3. Set `PROVIDER_FINDER_DISCOVERY_ENABLED=true` on the server and `NEXT_PUBLIC_PROVIDER_FINDER_DISCOVERY_ENABLED=true` at build time only after deploy, migration, privacy review and worker-controlled publication UI verification. Both flags default to off.
4. Verify NextAuth session restoration, CSRF origin checks, worker ownership before publish, participant preference erasure and audit event persistence.
5. Verify API route rate-limiting. Existing `checkIpRateLimit` is process-local only: **configure and verify a distributed limit before production scale**. The chat route currently enforces 20 requests/minute per process/IP.
6. Test all browsers plus mobile web and actual Expo device builds; carry out WCAG 2.2 AA checks for keyboard, screen reader, zoom, touch targets, high contrast and reduced-motion.

### Feature flags

```bash
PROVIDER_FINDER_DISCOVERY_ENABLED=false
NEXT_PUBLIC_PROVIDER_FINDER_DISCOVERY_ENABLED=false
```

The feature is **not** production ready simply because code exists. Do not automatically import accessibility profiles, communication passports, NDIS plan data or diagnosis for personalisation. Future cross-module personalisation requires purpose-specific consent and auditable data minimisation.

## Regulatory evidence

Four separate types must never be conflated:

- **Provider directory:** imported NDIS Provider Finder snapshot; show provenance/freshness, cannot be interpreted as a live registration check.
- **Provider registration:** independently verify against the NDIS Commission Provider Register by legal name or ABN; do not equate registry entry with quality, insurance or availability.
- **Worker screening:** individual status is not publicly verifiable by ordinary name search; use authorised NWSD / state Worker Screening Unit checks. Do not label `WorkerProfile.verificationStatus` as an official NWSD result.
- **Compliance and enforcement:** separate public search; absence of published action does not mean a worker or provider is safe or has no history.

The NDIS Commission's operational worker-screening portal guidance changed in October 2026. The exact 2026 registered/unregistered/self-managed participant verification routes should be confirmed with current official NDIS Commission guidance before onboarding or product launch.

## Trust and consent workflow

- Worker profiles are **private by default**. Worker signs in to `/worker/directory-settings`, explicitly publishes one of their own linked profiles, and may withdraw at any time. The API cannot publish a different worker's record via provider management privileges.
- Participant signs in to `/provider-finder/preferences`, explicitly enables and saves broad search preferences, and separately chooses to use them in a given chat. Deleting/turning off erases the preference row.
- Never leak a worker's screening status, credential files, employee relations, organisation private notes, participant addresses or contacts in directory search events.
- A worker's directory consent should not be presumed to extend to contact sharing, data brokers, advertisements or AI model training.
- Human confirmation is mandatory for complex clinical/high-intensity supports, matching safety concerns, credential exceptions, and safeguarding decisions.
- Add accessibility tests for empty/error/partial streams, no matches, dense map pins, non-visual result lists, AAC input timing and session expiration.

## API contract examples

`POST /api/provider-finder/chat` continues to accept the existing AI SDK 6 `messages`, `sessionId` and `session` fields. Optionally accepts:
- `scope: "providers" | "workers" | "both"`: `workers` and `both` resolve only for authenticated accounts.
- `useSavedPreferences: boolean`: requires signed-in user and an explicitly enabled saved preference.
- Existing initial interpretation and clarification events continue unchanged.

`GET|PUT|DELETE /api/provider-finder/preferences`: owner-scoped, cookie session, same-origin mutations.
`GET|PUT /api/workers/directory-publication`: worker owner only, same-origin mutations.

No cross-origin API token, public JWT, or native session bridge is implemented. Expo must use the first-party secure browser handoff rather than storing web cookies or bypassing consent.

## Follow-up release gates

- Define provider-query service and region matching robustly against actual imported NDIS dataset; current existing provider-name full-text and exact-service matching can produce empty results for conversational phrases. Do not silently lower hard safety filters.
- Add worker directory paging, explicit quality/freshness source timestamps, contact consent before messaging, and an appeal/correction workflow for published details.
- Validate the stacked PR independently from PR #627, plus the integrated result after merging the parent branch.
- Audit operational cost: static imports, deterministic DB queries, and bounded results should be preferred to unnecessary model generation.

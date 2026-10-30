# MapAble provider chat search (draft)

## Implemented
- Route: `/provider-finder/service-map`; API: `POST /api/providers/chat-search`.
- Requires an existing NextAuth / MapAble user session; no new auth provider is provisioned.
- Uses a streaming NDJSON response with status, message, context, provider and completion events.
- Uses existing Neon-backed Prisma NDIS provider search; no production schema modification.
- Optional per-request state, postcode and communication preferences. No diagnosis, precise address, or preference history is stored by this change.
- Communication preferences are **not** verified as supported by returned providers. Worker searches return provider-level fallback only.
- Cancellation and live region announcements support accessible use.

## Known limitations / follow-ups
- Not an LLM. Deterministic text parsing currently recognises known state names/abbreviations, postcodes and a small service vocabulary; city/suburb free-text extraction is not implemented.
- Imported provider records are not live registration evidence. No NWSD connection, worker profiles, current availability, worker clearances, employment or credential assertions.
- Search uses existing `searchNdisProviders` cap of 100, requests 25 rows before client-side service filtering, and displays up to 12; this can miss matching records. Implement server-side supported service taxonomy and proper pagination before production.
- Preferences are supplied explicitly each time, not loaded or persisted to a user profile. For durable opt-in preferences, design user-owned encrypted storage, strict purpose consent, access/deletion/export controls, and privacy review before migration.
- Stream is event-based results delivery, not token-by-token model inference.
- Mobile clients should reuse the authenticated endpoint through existing mobile authentication/session machinery; do not send browser cookies or database secrets from native code.
- Profile matching must be implemented as explicit confirmed evidence and not inferred from diagnoses.
- Add rate limiting, safety-oriented abuse controls, audit minimisation and data freshness telemetry before release.
- Cross-site request forgery protection needs testing for authenticated cookie POST requests; origin/CSRF control must be verified against existing app middleware.
- Add automated tests for 401/400, stream event contract, aborted requests, no leaked user data, screening wording, and empty datasets.

**Release gate:** human review, test and deploy via standard CI. No production deployment was performed.

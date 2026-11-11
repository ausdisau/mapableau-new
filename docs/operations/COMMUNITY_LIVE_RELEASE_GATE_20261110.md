# MapAble Community — gated live backend delivery record

**Status:** implemented as an unmerged, flag-off development slice. **Not production-ready.**  
**Target:** \`ausdisau/mapableau-new\`, branch \`feat/community-live-neon-20261110\` (based on \`cursor/community-signal-sites-65ff\`).  
**Production route:** \`https://mapable.com.au/community\` continues to use active Vercel Routing Engine proxy rules. Do not disable those rules before the replacement application has passed all gates.

## Evidence and source boundaries

- The React page in PR #690 is an independent local-only prototype, not a shared community network.
- The new \`/api/community-live/*\` routes and Prisma models constitute a **separate, unconnected server-side vertical slice**. They must not be mistaken for a migration of local files or seeded examples.
- Existing production infrastructure includes a \`mapableau\` Vercel project and an Australian-region Neon project named \`MabAble\`. Its actual production binding and data-processing boundaries must be audited before data writes.
- Never load or merge browser-local fictional seeds into shared Neon tables.
- Ratings are initially **Unknown**. A human moderator's publication approval does not create an independent access verification, NDIS clearance, accessibility certification, or route guarantee.

## Delivered in development

1. Additive Prisma models and SQL migration for challenges, observations and minimal audit metadata.
2. Existing NextAuth-issued session and database-backed \`requireApiSession\`/\`requireApiAdmin\` are the only accepted authorities.
3. New, explicitly enabled server routes for public published challenges, user-scoped observations, withdrawal, and administrative moderation.
4. Strict Zod request validation, same-origin mutation checks, 12 KB body limit, no-store responses.
5. Challenges created **draft** even when the caller is an administrator. No auto-publication.
6. Consent \`private\`, \`review\`, \`public\` selected explicitly, with a versioned receipt and fail-closed default.
7. Only approved observations with explicit public consent and a published challenge can be read publicly. Public output excludes actor IDs, raw coordinates, attachment IDs and moderation notes.
8. Withdrawal removes public visibility and clears submitted free text; audit records retain only action identifiers. A separate retention/deletion review is still needed.
9. A moderator cannot approve their own observations. Approval is recorded but initial rating stays **Unknown**.
10. Vitest assertions for consent, disclosure, role separation, request origins and input validation.

## Required before even a limited genuine-data pilot

- **Auth:** verify sessions and role changes against the existing live NextAuth authority; prohibit header-driven identity, spoofed delegates and unauthorised moderation.
- **Rate limits and abuse:** distributed, server-side throttling, anti-spam, reporting, escalation, moderation workload and safety procedures.
- **Consent and privacy:** accessible consent text, revocation propagation, retention/deletion schedule, backups, data subject rights, age and safeguarding procedures; no sensitive health, address or identifying evidence by default.
- **Public review:** human redaction and an evidence quality workflow before any free-text field reaches a public feed; avoid doxxing or automatic claims.
- **Uploads:** private, scanned object storage, MIME sniffing, EXIF metadata removal, consent-bound signed access, limits and deletion. No upload endpoint yet.
- **Database:** inspect exact target environment, take backup or verify PITR, use isolated Neon branch for migration dry run, check schema drift and migration status, and verify AU residency/processor contracts. No SQL run against production in this implementation.
- **Web:** connect accessible UI to real endpoints behind an explicit live flag. The existing local-only UI is not yet wired. Test 200–400% zoom, AAC, screen readers, keyboard-only, reduced motion, offline states and session expiry.
- **Reliability:** integration tests for concurrent withdrawal versus moderation, user ownership, inaccessible database, errors, pagination and recovery. CI TypeScript/build, formatting, security, accessibility and independent review must all pass.
- **Release:** protected preview, evidence captured for exact SHA, human approval; coordinate removal of **both** project routing rules only after the replacement route works. Never change production domains, existing app settings or other branches as a side effect.
- **Operational:** complaints/reportable incident routing, participant-controlled appeal and correction, safe content policy, human moderator accountability, rollback rehearsals and monitoring.

## Feature flag

\`MAPABLE_COMMUNITY_LIVE_ENABLED\` defaults to **off** if unset. This is a server-only variable. Do not turn it on in production without the gates above and approval.

## Decision

**HOLD** live data collection and route cutover. The backend scaffold is real code but is neither schema-migrated nor operationally ready. Keep the current browser-local project explicitly labelled and preserve user-controlled exports.

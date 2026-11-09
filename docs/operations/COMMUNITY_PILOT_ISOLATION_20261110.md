# MapAble Community — closed authenticated pilot gates

**Status (10 November 2026):** Proposed pilot isolation implemented on a draft GitHub branch; **not a working deployment**, not authorised for real participant data, and not a production release.

## Verified existing system

- The existing `/community` in-app page and `/api/community/live/*` NextAuth/Prisma routes already exist on `main`. The feature flag `MAPABLE_COMMUNITY_LIVE_ENABLED` defaults to off.
- The UI supports text entry, AAC-friendly phrases, consent selection, lists of personal submissions, participant-requested removal and administrator review. These are implementation claims, **not verified service availability**.
- The configured Neon project `square-grass-31199936` is in AWS Sydney (`aws-ap-southeast-2`), but the three `CommunitySignal*` tables were **absent** from the inspected default branch on 10 November. This does not prove which database production Vercel uses.
- The Vercel `mapableau` project has **no independently confirmed preview database or NextAuth session credentials**. Never copy production secrets into an untrusted preview.
- Two Vercel Routing Engine rules continue directing `/community` and nested paths to the existing `mapable-community` service. **Do not disable them** before release approval.
- Existing CI/Quality/Security checks and Vercel builds have failures. A green static test does not satisfy these release gates.

## Closed-pilot configuration

The preview (and **only** the protected preview) needs these server-side variables, configured by an authorised administrator:

| Setting | Preview configuration | Safety effect |
| --- | --- | --- |
| `MAPABLE_COMMUNITY_LIVE_ENABLED` | `true` only after environment checks | Opens real API and in-app UI |
| `MAPABLE_COMMUNITY_PILOT_MODE` | `true` | Requires an invited NextAuth user ID on every community API and page |
| `MAPABLE_COMMUNITY_PILOT_USER_IDS` | A small, reviewed, comma-separated set of test-account IDs | Empty/unset list denies everyone |
| `DATABASE_URL` / `DIRECT_URL` | Isolated, synthetic-only AU database with verified schema and no real participant records | Prevents live-data exposure |
| `NEXTAUTH_SECRET` and matching NextAuth origin | Separate preview-session configuration, reviewed for account isolation | Prevents session mixing with production |

Never use `NEXT_PUBLIC_*` for the pilot allowlist. The pilot mode must remain **OFF in production**. The runtime makes the live feature unavailable if pilot mode is accidentally set on a production Vercel deployment.

## Participant journey to validate in the protected environment

1. **Unauthenticated visit:** no read or write APIs, no participant data; accessible sign-in explanation.
2. **Signed-in non-invited account:** receives 403 on every pilot API and cannot open the community moderation page.
3. **Invited participant:** sees only their own private entries; creates a scoped observation with explicit **private** or **moderator-review-only** consent; initial rating stays **Unknown**.
4. **Review-only consent:** only authorised reviewers can read the submitted text. It cannot become public without a new, explicit public-consent decision.
5. **Public publication disabled:** public consent, approval, and public-feed responses are disabled at server and UI level throughout pilot mode. Reviewers can request clarification or reject a submission; no pilot report can be approved for public release.
6. **Withdrawal:** participant removes their submission; it must disappear from own and public queries. Minimal audit metadata may remain according to a reviewed retention schedule. Check concurrency with a moderator approving at the same time.
7. **Unavailability:** network failure, lost session, disabled flag and database outage must not imply a submission succeeded.
8. **AAC and access:** test keyboard-only, slow input, speech dictation, screen readers, 200–400% zoom, reduced motion, language clarity, focus management, error recovery and alternative text-based place information.

## Operational and regulatory gates

- Privileged moderation operations use existing MapAble Core session and server-side administrator roles. No caller-supplied user IDs or headers can grant authority.
- Real participant submissions require content-safety triage, distributed rate limiting, abuse reporting and escalation, accessible privacy and consent notices, NSW/Australian privacy review, retention and deletion including backups, and an accountable human moderation rota.
- Any location or photograph submission requires a separate approved workflow: no precise GPS or EXIF uploads in this vertical slice.
- A verified access claim cannot be inferred from community review, survey completion, imported source metadata or NDIS registration.
- Neon migration must first be replayed in a *genuinely isolated, synthetic-only* AU environment. Branching production copies data: do not copy or expose protected participant records in preview.
- Verify audit and rollback of schema, API and Vercel cutover. Never enable public posting or replace the external `/community` route without signed release authorisation.

## Release evidence to capture

- Exact GitHub commit SHA; passing typecheck, Vitest, security, migrations, accessibility and full Vercel build.
- Database branch/project ID and schema-only validation; no connection strings in evidence.
- Authenticated two-person moderation simulation, consent withdrawal race, owner permission/403 checks, and denied anonymous GET/POST.
- Protected preview browser tests; confirmation that production routing/domains/projects remain unchanged.
- Named human approver and explicit go/no-go decision, plus rollback owner and monitoring channel.

**Decision:** HOLD live data collection and public publication until these gates are passed.

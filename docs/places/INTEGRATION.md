# MapAble Places × CripSquare — repository integration (controlled)

**Status:** GitHub PR #623, integrated **in development branch only**; not merged, deployed, certified or open for actual community posting.

## What is now connected

| Surface | Implementation | Boundary |
|---|---|---|
| Main Next.js | `/places` | Feature-gated entrypoint, canonical published venue cards and links to existing access profiles |
| MapAble navigation | `MarketingPrimaryNav`, `MapAbleAccessShell` | Link appears only when the client feature flag is explicitly enabled |
| Read-only API | `GET /api/places/prototype` | Returns at most 50 published canonical `AccessPlace` directory summaries |
| Expo / React Native | `apps/places` | Accessible discovery, locally persisted bookmarks/memories/reports and illustrative community drafts |
| CripSquare | Fixture-only circles / posts | **No live backend, login, membership, RSVP, moderation or publication** |

The API does not return internal place records, location histories, reviewer identities, participant access preferences or any user-authored prototype notes. Every returned step-free and toilet state is `unknown` in the brief directory feed. The canonical Access profile remains the place to inspect actual sourced feature-level evidence.

## Activation and hard boundaries

All integration flags are **false or empty by default**:

```dotenv
# Main Next app (local development only for this phase)
MAPABLE_PLACES_PROTOTYPE_ENABLED=true
NEXT_PUBLIC_MAPABLE_PLACES_PROTOTYPE_ENABLED=true
MAPABLE_PLACES_PREVIEW_URL=http://localhost:8081
# Optional: production must specify exact reviewed HTTPS Expo web origin
MAPABLE_PLACES_EXPO_ORIGIN=
```

```dotenv
# apps/places/.env.local
EXPO_PUBLIC_MAPABLE_API_URL=http://localhost:3000
```

- The main gateway is missing (404) when `MAPABLE_PLACES_PROTOTYPE_ENABLED` is not `true`.
- The read-only integration API is missing (404) with the same server flag off.
- Cross-origin web GET is restricted to exact configured, validated HTTPS origin or local Expo ports in non-production. It never sets wildcard CORS or access-control credentials.
- The production preview URL allows HTTPS origin-only; local HTTP loopback URLs are allowed for development only. Arbitrary URL paths, userinfo, query strings and fragments are rejected.
- Do not publish an unverified production URL or set the prototype flags in production before privacy and safeguarding review.

## Local testing

```bash
# Terminal A, root
pnpm install --frozen-lockfile
pnpm exec vitest run tests/mapable-places-integration.test.ts
pnpm type-check
pnpm dev

# Terminal B
cd apps/places
npm install
npm run check:prototype
npm run web
```

Then open `http://localhost:3000/places`, select a canonical published place, and open the separate Expo frontend at `http://localhost:8081`. In Expo, check directory refresh, private saving, edits, validation, export and deletion. The optional live MapAble feed needs a functioning development database with published places. Without one, the offline demonstration still works. No live CripSquare backend is required.

## Accessibility / safety and privacy review gates

1. WCAG 2.2 AA: keyboard and assistive-tech testing, text resize/reflow, screen-reader status, colour contrast and high zoom.
2. ATAG 2.0 Parts A and B: disabled author testing of validation, previews, error repair, saving/editing drafts and accessible output.
3. Root analytics boundary: `app/layout.tsx` currently mounts Google Analytics, AdSense and Vercel Speed Insights when their separate flags are active. Their behaviour must be assessed before offering private place authoring on any main-site route. The root gateway currently has **no authoring form or location tracking** and intentionally links to the standalone app for private records.
4. Privacy: the Expo prototype uses unencrypted local AsyncStorage. Replace it with a participant-owned security/consent model before storing sensitive information or deploying broadly.
5. CripSquare: secure contract, authentication, moderation, reporting/blocking, safeguarding and disability-led user testing are not implemented in this PR.
6. Root repository quality: the source PR was failing CI formatting on the Expo workflow, three unrelated product tests, and a dependency audit with an expired `deepmerge-ts` waiver. These are separate acceptance gates and not permission to bypass CI.
7. Hosting: Vercel account-level deployment blocks must be resolved separately. No automated deployment or merge is requested from this integration.

## Rollback

Keep both feature flags off to disable navigation, the Next gateway and the API. The Expo app remains isolated under `apps/places` and can be removed without a migration. No production database write, credential, webhook, private user account or CripSquare connection is introduced.

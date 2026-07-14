# In-marker rating and commenting — MapAble Access

Assessment and MVP plan for the community accessibility marker card system.

## 1. Current repo assessment

| Area | Finding | Key paths |
|------|---------|-----------|
| **Map** | MapLibre via `react-map-gl`. Access map uses HTML button markers (no popup yet). | `components/access/AccessMap.tsx`, `AccessMapLayer.tsx`, `MapAbleAccessShell.tsx` |
| **Markers** | Clickable name pills; selection state only — **no in-marker card**. | `AccessMapLayer.tsx` |
| **Place model** | Canonical `AccessPlace` (+ location, features, reviews, rating summaries). Older `AccessiblePlace` still exists for v1 API. | `prisma/schema.prisma` (~6502+), `types/access-map.ts` |
| **Existing reviews** | Full community review flow with fine-grained `AccessRatingCategory` enums, moderation queue, photos. **Not wired into map markers**. | `lib/access-reviews/*`, `components/access-reviews/*`, `/api/access/places/[placeId]/reviews` |
| **Auth** | NextAuth JWT; `requireApiSession` / `optional session` for public reads. | `lib/api/auth-handler.ts`, `app/api/auth/[...nextauth]/authOptions.ts` |
| **DB client** | Prisma singleton. Migrations under `prisma/migrations/`. | `lib/prisma.ts` |
| **API pattern** | Route handlers + Zod + `jsonOk`/`jsonError`. Rare server actions. | `app/api/access/*`, `lib/api/response.ts` |
| **UI system** | Partial shadcn (`button`, `card`, `badge`). No Dialog/Drawer primitive — custom modals. Forms use `AccessibleFormField`. | `components/ui/*`, `components/forms/AccessibleFormField.tsx` |
| **A11y** | Map has `role="application"` + list alternative; inputs use `min-h-11`; review form has basic ARIA. No focus-trap library. | `AccessMap.tsx`, `MapAccessibleResultsList.tsx` |
| **Transport** | Transport trips exist under `/dashboard/transport`. No marker→transport bridge yet. | `app/dashboard/transport/*` |
| **Gap** | `/access` is marketing-only; `MapAbleAccessShell` (browse/map) is **not mounted on a page**. |

### Reuse vs invent

**Do not replace** `AccessPlaceReview` for the long-form place-profile reviews.

**Add** a parallel lightweight marker feedback domain for in-map actions:

- Compact 6-domain + overall numeric ratings (0–5, 0 = don’t know)
- Typed short comments / temporary alerts
- Verification / dispute actions
- Precomputed aggregate + confidence for popup rendering

Maps onto product types via `AccessMarker*` Prisma models (Access* naming convention).

## 2. Files to change

- `prisma/schema.prisma` — models + User/AccessPlace relations
- `components/access/AccessMapLayer.tsx` — richer a11y labels + popup anchor
- `components/access/MapAbleAccessShell.tsx` — selected-place popup + forms
- `components/access/AccessMap.tsx` — pass through summary data if needed
- `lib/access-moderation/content-safety-rules.ts` — extend for legal declarations / staff names / unsafe advice
- `app/access/page.tsx` or new `app/access/map/page.tsx` — mount browse shell

## 3. New files to create

| Path | Role |
|------|------|
| `docs/access/in-marker-rating-system.md` | This assessment |
| `prisma/migrations/YYYYMMDD_access_marker_feedback/migration.sql` | Tables |
| `lib/access-markers/types.ts` | Shared TypesScript shapes |
| `lib/access-markers/scoring.ts` | Domain averages + confidence |
| `lib/access-markers/moderation.ts` | Comment pre-publish flags |
| `lib/access-markers/marker-summary-service.ts` | Aggregate marker summary DTO |
| `lib/access-markers/rating-service.ts` | Create rating + recompute |
| `lib/access-markers/comment-service.ts` | Create comment + moderation |
| `lib/access-markers/verification-service.ts` | Verify / dispute / resolve alert |
| `lib/validation/access-marker.ts` | Zod schemas |
| `app/api/access/places/[placeId]/marker-summary/route.ts` | GET summary |
| `app/api/access/places/[placeId]/ratings/route.ts` | POST rating |
| `app/api/access/places/[placeId]/comments/route.ts` | POST comment |
| `app/api/access/places/[placeId]/verify/route.ts` | POST verify/dispute |
| `app/api/access/comments/[commentId]/report/route.ts` | POST report |
| `components/access/AccessMarkerPopup.tsx` | In-marker card |
| `components/access/AccessMarkerRatingForm.tsx` | Compact rating modal |
| `components/access/AccessMarkerCommentForm.tsx` | Comment modal |
| `components/access/AccessMarkerModal.tsx` | Focus-managed dialog shell |
| `lib/access-markers/plan-accessible-transport.ts` | Transport deep-link helper |
| `tests/access-marker-scoring.test.ts` | Scoring unit tests |
| `tests/access-marker-moderation.test.ts` | Moderation unit tests |

## 4. Database migration plan

New enums:

- `AccessMarkerContentStatus` — published | needs_review | hidden | disputed | archived
- `AccessMarkerCommentType` — general | mobility | toilet | parking | sensory | communication | staff_service | temporary_alert | transport_dropoff | correction
- `AccessMarkerVerificationAction` — confirm_accurate | mark_outdated | dispute | resolve_alert | suggest_evidence
- `AccessMobilityAidType` — manual_wheelchair | powerchair | mobility_scooter | walker | cane | other

New tables (mapped names):

1. `access_marker_ratings` — per-user domain scores (0–5, null for unknown)
2. `access_marker_comments` — typed comments + moderationFlags Json
3. `access_marker_aggregate_scores` — one row per place (upserted)
4. `access_marker_verifications` — confirm/outdated/dispute actions
5. Reuse `access_moderation_queue` / `access_content_reports` with `entityType` strings (`AccessMarkerComment`, etc.)

Indexes: `(placeId, status)`, `(placeId, createdAt)`, unique `(placeId)` on aggregate.

## 5. Implementation sequence

1. Schema + migration + Prisma generate  
2. Scoring + moderation pure functions + tests  
3. Services (summary, rating, comment, verify)  
4. API routes  
5. Modal shell + rating/comment forms  
6. Marker popup + map wiring  
7. Mount `/access/map` browse page  
8. Transport plan URL stub  
9. Docs + PR  

## 6. Accessibility testing checklist

- [ ] Marker button has full SR label (name, overall %, confidence %, comment count, alerts)
- [ ] Enter/Space opens popup; Escape closes; focus returns to marker
- [ ] Popup is keyboard-navigable; all actions reachable without hover
- [ ] Touch targets ≥ 44px (prefer 48px / `min-h-12` or `min-h-11`)
- [ ] Forms use `AccessibleFormField` with linked errors (`aria-describedby`)
- [ ] Score meaning not colour-only (text + optional icon)
- [ ] `prefers-reduced-motion` respected (no required motion)
- [ ] Works with 200% zoom / large text
- [ ] List view remains available as map alternative

## 7. Moderation testing checklist

- [ ] Phone/email → needs_review  
- [ ] Legal phrases (“illegally discriminates”, “DDA certified”) → needs_review  
- [ ] Staff personal names patterns → needs_review  
- [ ] Abuse keywords → needs_review  
- [ ] Unsafe advice cues → needs_review  
- [ ] Clean observational comment publishes immediately  
- [ ] Report endpoint creates `AccessContentReport`  
- [ ] Privacy confirmation checkbox required for comment submit  

## 8. Risks and mitigations

| Risk | Mitigation |
|------|------------|
| Duplicate systems with `AccessPlaceReview` | Document that reviews = long-form place profile; marker ratings = lightweight map feedback. Optional later sync. |
| Schema bloat / User relation growth | Prefer Access* naming; keep relations minimal and indexed. |
| Over-moderation of genuine reports | Prefer needs_review over auto-reject; preserve evidence for moderators. |
| Confidence gaming / spam ratings | Rate limits; one published rating per user per place (upsert); dispute penalty. |
| Transport deep-link incomplete | Stub route with query params; graceful fallback when no coordinates. |
| `/access` still marketing-only | Ship `/access/map` without replacing marketing copy; link from shell header. |

## 9. Scoring MVP

- Domain score (0–100) = average of known 1–5 ratings × 20 (ignore 0 / null)  
- Overall = average of available domain scores (or explicit overall ratings)  
- Confidence (0–100):  
  - +8 per rating (cap 40)  
  - +25 if last rating ≤ 90 days  
  - +5 per verification confirm (cap 20)  
  - +5 per photo evidence (cap 10)  
  - −10 per open dispute (floor 0)

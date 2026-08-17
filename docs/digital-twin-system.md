# MapAble Digital Twin System

## 1. Purpose

The MapAble Digital Twin is an accessibility-first, persistent 2D spatial model of real places. It represents zones, routes, features, evidence, assessments, issues, and user-controlled access compatibility — not a VR gimmick or legal certification.

**Warning:** Digital Twin accessibility information is not legal certification and should not replace professional advice, emergency services, or direct confirmation of critical access needs.

## 2. Architecture

```
lib/digital-twin/          Domain types, engines, in-memory service
app/api/digital-twin/      REST API (MVP uses demo/in-memory store)
app/digital-twin/          Public explorer, detail, intelligence pages
components/digital-twin/   UI components
```

Future integration with `AccessPlace` (Prisma) via adapter layer — see `docs/digital-twin/PROPOSED_MIGRATION.md`.

## 3. Domain model

Core entities: `TwinPlace`, `TwinZone`, `TwinFeature`, `TwinPathSegment`, `TwinEvidence`, `TwinAssessment`, `TwinIssue`, `AccessNeedProfile`, `TwinCompatibilityResult`, `TwinConsentGrant`.

Types: [`lib/digital-twin/types.ts`](../lib/digital-twin/types.ts)

## 4. Data privacy principles

- User control, consent, and privacy by default
- No hidden sharing of disability, health, housing, complaint, transport, or support information
- Compatibility checks run locally / in-request without persisting profile data (MVP)
- Demo data clearly marked; fictional places only

## 5. Evidence model

Evidence types include assessor notes, user reviews, photos, measurements, venue declarations, sensor status, and maintenance updates. Submissions enter `pending_review` — not auto-published.

## 6. Scoring model

Eight domain groups: external_path, entry_exit, interior_movement, amenities_toilets, information_sensory, staff_services, transport_connection, online_information.

Tiers (MapAble-style):
- Bronze: 40.00–69.99
- Silver: 70.00–89.99
- Gold: 90.00–100.00

Unknown data reduces confidence, not automatic accessibility failure.

## 7. Compatibility model

Compares place features and paths against `AccessNeedProfile` or manual need selections. Returns score, matched needs, barriers, unknowns, recommended actions, and plain-language explanation.

## 8. Consent and Access Pass integration

Demo stubs at `/access-pass/demo`. Production will use `lib/consent/consent-service.ts` and `AccessibilityProfile` with explicit consent scopes.

## 9. Governance and attestation stubs

`lib/digital-twin/governance.ts` — audit events, attestations, payload hashing, sensitive field redaction. Future connection to MapAble smart-contract attestation layer (not blockchain speculation).

## 10. Public pages and routes

| Route | Purpose |
|-------|---------|
| `/digital-twin` | Explorer with filters and demo place cards |
| `/digital-twin/[slug]` | Place detail, compatibility demo, forms |
| `/digital-twin/intelligence` | Privacy-safe aggregate insights |
| `/access-pass/demo` | Access Pass and consent UI demo |
| `/admin/digital-twin` | Admin dashboard (protected) |

## 11. API endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/digital-twin/places` | List places with filters |
| POST | `/api/digital-twin/places` | Create draft place (auth) |
| GET/PATCH | `/api/digital-twin/places/[id]` | Get/update place |
| GET | `/api/digital-twin/places/[id]/assessment` | Get assessment |
| POST | `/api/digital-twin/places/[id]/assessment/recalculate` | Recalculate (auth) |
| POST | `/api/digital-twin/places/[id]/issues` | Submit issue (moderated) |
| POST | `/api/digital-twin/evidence` | Submit evidence (moderated) |
| POST | `/api/digital-twin/compatibility` | Run compatibility check |
| POST | `/api/digital-twin/consent/check` | Demo consent evaluation |

## 12. Demo data

Fictional Sydney-area places in [`lib/digital-twin/sample-data.ts`](../lib/digital-twin/sample-data.ts). Two demo access profiles (power wheelchair, AAC user).

## 13. Known limitations

- In-memory store only — no production DB persistence
- No image/document upload pipeline
- Map shows accessible list fallback (MapLibre integration placeholder)
- Admin actions are placeholders
- No automatic publication of community submissions

## 14. Future work

- Production database migrations (PostGIS route geometry)
- GTFS and transport feed integration
- 3D indoor scans only after 2D model is reliable
- Venue self-service portal
- Assessor mobile workflow
- Offline audit mode
- Image/document uploads
- Moderation queue
- Access Pass persistence
- PlanOps integration
- Intelligence reports for councils/providers

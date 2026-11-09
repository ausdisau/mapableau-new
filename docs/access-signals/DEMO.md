# Access Signals synthetic demo

Status: **code-only prototype**, default-off. MapAble brand UI matching design
screenshots for Explore, Field Notes (Observe), and Remediation workspace.

## Flag

`MAPABLE_ACCESS_SIGNALS_DEMO_ENABLED=false` in `.env.example`. Hard-off when
`NODE_ENV` or `VERCEL_ENV` is `production`. Does **not** enable AccessCast, live
place ratings, remediation backends, or `MAPABLE_ACCESS_REMEDIATION_ENABLED`.

## Routes

| Path | Screen |
| --- | --- |
| `/access-signals` | Explore (list + illustrative map) |
| `/access-signals/challenges` | Five fictional community challenges with optional session-only checklists and Field Notes links |
| `/access-signals/field-notes` | Field Notes Observe (local draft only) |
| `/access-signals/remediation` | Remediation workspace |
| `/access-signals/evidence` | Placeholder |
| `/access-signals/change-ledger` | Placeholder |
| `/access-signals/requirements` | Placeholder |
| `/access-signals/settings` | Placeholder |

## Relationship to existing Access products

- `/access` and AccessCast remain the live product surfaces.
- This demo introduces RAGU (red / amber / green / unknown) as a **prototype**
  vocabulary with text + geometric shapes. It is not merged into AccessCast
  state machines.
- No Neon schema, evidence store, or change ledger persistence.

## Community challenge controls

Five participant-led missions cover journeys, entrances, sensory/communication access, essential facilities, and change detection. They reuse fictional route IDs and existing Field Notes. Optional checklists stay in session storage; no server submissions, leaderboards, GPS, verification or public publishing. Challenge context is linked to Field Notes by query parameter, but the existing Field Notes does not persist challenge attribution.

Production remains hard-off. A future real pilot needs dedicated moderation and evidence review, consent/withdrawal, safe media handling, contributor safeguards, appeals, accessibility testing, operational staffing, and a privacy review.

## Accessibility notes

Skip link, ≥44px targets, labelled radios, `aria-live` for draft status, list
view labelled as accessible alternative to the map, RAGU never colour-only.
Automated tests ≠ WCAG conformance claim.

## Non-goals

Live place publication, real map navigation, evidence upload, paid confidence,
production flag enablement, DNS/deploy.

# MapAble participant-facing copy readiness — November 2026

**Change class:** Editorial safety and product-claim accuracy. No synthetic model, rating algorithm, authentication, real consent, database or live feature flags are changed.

## Why this change exists

Visible 'Demo' labels, invented-looking statistics, meaningless scores and inactive buttons can make users think unavailable functionality is live. Rewording alone cannot convert a proof of concept into an operating service. The release therefore replaces placeholder-style copy with trustworthy, accessible status language and suppresses some fabricated presentation.

## Applied across the legacy `mapableau-new` website

| Area | Before | After |
| --- | --- | --- |
| Homepage Access Map | Demo cards alongside scored places | Clearly fictional examples; no sample access scores presented as verified facts |
| Accessibility Map place profile | Demo access rating exposed to search schema | Example profile carries an Unknown state, is noindexed, and omits JSON-LD place claims for fictional entries |
| Access Intelligence | 'Demo' metric values and report types | Explicit not reported / not assessed / proposed availability states |
| Journey Planner | Fixed 'confidence 58/100' and demo booking language | Unconfirmed journey outline; no route safety or transport guarantee |
| Venue verification | Fabricated Silver / access 78 / review dates | Not assessed / not awarded / not recorded; local-only enquiry text |
| Provider examples | Fake access-readiness scores and registration language | Fictional profiles identified as unverified, safer calls to action |
| Access Pass | Inert Revoke and Audit buttons | Explicit 'No sharing has occurred' note; nothing saved or transmitted |
| Access Signals | Demo/placeholder headings | Illustrative, not-connected copy; fictional route data and human-review limitations remain visible |
| Partner reporting | Fake infrastructure incidents and reports | No connected reports; no fake CSV/PDF success |
| Partner dashboard | Fictional API usage, embeds, credits | Not reported/not connected statuses |
| Partner referrals | Fictional links and credited referrals | No issued referral link or real credited records; auth guard preserved |
| Provider Growth | Fabricated response and conversion KPIs | Not measured/not assessed statuses, future options identified as proposed |
| Supporting screens | Generic demo/placeholder phrases | Plain-language illustrative or unavailable states |
| Legacy Vite login | Always-visible development test login shortcuts | Development-only visibility; no public demo credential buttons |

## Non-negotiable constraints

- Do **not** remove fictional/synthetic/test labels when data is fictional. That would create misleading claims.
- Do **not** infer that historical MapAble GAIS records, partner feeds or imported provider data are verified. Source provenance, missingness and correction pathways must remain explicit.
- Do **not** equate one accessible feature with universal venue or personal journey suitability.
- Do **not** present sample fees, access grades, NDIS registrations, approvals, bookings, receipts, worker clearances or payments as real.
- Do **not** make inactive buttons look like they completed irreversible, externally visible actions.
- Existing status types, flags, test fixture names, development routes and API contracts remain unchanged where necessary for compatibility.

## Verification and limitations

- Unit source guards in `tests/marketing/demo-copy-guard.test.ts` cover critical false-claim regressions.
- Manual review remains required for screen readers, voice/AAC, keyboard, 200–400% zoom and accessible error/recovery messages.
- Run CI, Next.js TypeScript/build and scoped lint on the PR head; unrelated existing failures must be identified separately.
- The updated text is implemented in a draft GitHub branch only and is **not deployed**.
- A repository-wide full content audit covering internal tools, training fixtures, historical docs, seeded data and the canonical `ausdisau/MapAble` repository is **not yet complete**. Internal 'demo' identifiers and safety notices deliberately remain.

## Release decision

**HOLD** for production until CI, a protected preview, accessibility review, owner approval and accuracy sign-off. Do not merge unrelated remediation PRs or enable real submissions as part of a copy-only change.
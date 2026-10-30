# MapAble Assessment production release gate

**Status:** implementation proposed; blocked for real production activation. The workflow only authorises a later owner-led deployment; it never deploys, turns a flag on, or accepts real participant data.

## Separation of controls

1. The participant assessment release flag (`MAPABLE_ASSESSMENT_REGISTRATION_ENABLED`) must already exist in merged `main`, defaulting to `false`. Until PR #632 is verified and merged, the existing `main` code does not have that dedicated gate.
2. The manual GitHub workflow `Assessment production approval gate` only runs against the exact **current main commit SHA** entered by an authorised operator. It verifies all named GitHub Actions checks, the canonical `Vercel – mapableau-new` status, current branch, protected preview and recorded independent reviews.
3. The `assessment-production` GitHub Environment **must have required human reviewers configured in repository Settings → Environments**. The workflow fails closed if that configuration cannot be read or verified. Repository administrators must also require CI/security checks before merging.
4. The workflow re-runs `pnpm ci:prod-audit` with a frozen lockfile. Eight expired exceptions recorded on 11 September 2026 still block this gate; no expiry extensions are proposed.
5. When preflight and GitHub Environment approval both pass, the workflow emits an approval result only. A separate authorised owner action must then deploy the approved SHA and update production environment settings, followed by smoke tests and rollback verification. No silent auto-promotion.

## Evidence contract

Create `docs/operations/assessment-production-evidence.json` through a separately reviewed PR. Its `releaseSha` and `preview.commitSha` must match the exact current main SHA. Required structure is illustrated in `assessment-production-evidence.example.json`, which is deliberately NOT_RUN and is **never accepted** as passing evidence.

Each reviewer (security, privacy, participant accessibility, operations) supplies `status: PASS`, identity, an HTTPS evidence reference and a review timestamp within 30 days. Additional PASS records with HTTPS evidence references are required for the consent/encryption/retention/deletion lifecycle and a rollback exercise. The preview must be protected, use synthetic data only, and match the same SHA.

A passing JSON schema represents evidence submitted for review, not independent validation that work actually happened. GitHub-required reviewers must check the underlying records and the accuracy of the sign-offs.

## Immediate blockers (31 October 2026)

- PR #632 is still draft, unmerged, with latest `83d1e72f` reporting **27 lint errors** and an expired dependency-audit allowlist.
- Vercel `mapableau-new` account returns HTTP 402 `resource_creation_blocked`, reporting a suspended subscription and requesting a valid payment method.
- The Next.js Vercel project is marked `live=false`; no deployment of the MapAble Assessment main commit has been confirmed.
- Independent privacy lifecycle and manual participant-led accessibility evidence are not yet verified. No real participant submissions should be enabled.
- Branch ruleset `20885585` does not currently include required status checks. Enforce required checks and independent approval using repository-owner permissions.

**Decision: NO-GO**. The gate mechanism may be merged through regular reviewed CI, but it must never be used to treat unresolved checks as an authorised release.

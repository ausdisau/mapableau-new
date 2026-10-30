# MapAble Assessment — four-gate readiness register

Status: DRAFT — NO-GO. Baseline: main commit 3970c318, PR #630 merged.
Owner: MapAble maintainer. Human reviewers: independent security/privacy and disability lived-experience specialists.

## Gate 1: CI and dependency security
Pass all typecheck, lint, unit, build, CSP and accessibility workflows against the same SHA. Do not weaken delegate permissions to pass tests. The eight advisory exceptions in security/advisory-allowlist.json expired 2026-09-11. Confirm current installed versions, safe upgrades, compensating controls and owner-reviewed decisions. Do not extend all expiry dates just to make CI green. Configure main-branch protection with required CI/Quality/Security/Accessibility checks and independent approval. Current ruleset 20885585 does not list required status checks; classic protection status remains unverified.

## Gate 2: participant data
Assessment submissions default OFF unless MAPABLE_ASSESSMENT_REGISTRATION_ENABLED is explicitly true. CI may enable it only with synthetic users. Verify session-scoped 401/403 failures, feature-off 503, account-bound writes, minimal audit metadata and legacy record classification. Do not treat old I-CAN-shaped drafts as new participant statements.

Before collecting real disability information verify encryption of assessment JSON, key management, consent grants and revocation, export and deletion rights, retention, access receipts, idempotency and robust rate limiting. These remain independent gates, not fulfilled by passing route tests.

## Gate 3: communication and accessibility
Run automated keyboard, form, focus, axe, zoom/reflow and reduced-motion tests on the assessment routes with seeded synthetic user accounts. Record manual NOT_RUN until disability-led evaluation covers AAC, NVDA, TalkBack, VoiceOver, switches, 200–400% zoom, Easy Read, interrupted sessions, consent comprehension and human assistance. Passing axe does not establish WCAG 2.2 AA.

## Gate 4: controlled preview
Resolve the Vercel account deployment restriction. Establish an exact-SHA restricted preview with synthetic data and separate environment settings; verify routes, headers, monitoring and rollback. Feature stays OFF by default. Only the project owner may approve production promotion after written reviews.

Never merge, deploy or enable production merely because one workflow is green. No automated NDIA submission, proprietary instrument scoring or clinical decisions.

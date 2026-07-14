# Mobile release plan

## Profiles (EAS)

| Profile | Purpose |
|---------|---------|
| development | Dev client, debugging |
| preview / internal | TestFlight + Play internal |
| production | Store binaries (human-approved only) |

## Proposed identifiers (not submitted)

- iOS bundle ID: `au.com.mapable.app`
- Android application ID: `au.com.mapable.app`

## First store-ready scope

Auth, Today, CareOS missions (appointment slice), Care confirm, Transport confirm, Access evidence, continuity, receipts, notifications, messages, privacy/authority, human help, offline critical summaries, settings/a11y prefs.

Worker companion: only if security + offline tests pass.  
Jobs / Moves / AbilityPay / Home & Living: live, read-only, or feature-flagged — never empty menus.

## Gates

Internal pilot: Definition of done in multitask prompt §30.  
Public store: privacy, security, disability-led a11y review, pilot resolution, account deletion, production monitoring, human approval.

## Rollback

Disable `MAPABLE_MOBILE_ENABLED`; halt phased release; keep prior production binary; document in `docs/mobile/rollback.md`.

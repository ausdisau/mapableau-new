# MapAble One — service handoff contracts

Read-only TypeScript contracts in `lib/ecosystem/handoff-contracts.ts`.

## Purpose

Describe participant-confirmed discovery suggestions between Challenges, Access, Transport, Day, Care, Community/CripSquare and Marketplace. They do **not** book, publish, pay, assign workers or mutate Core records.

## Shape

`ServiceHandoffRequest` includes:

- service identifier (`EcosystemServiceId`)
- source record identifier
- participant authority
- required permission
- requested action
- evidence status (`observed` / `unverified-report` / `moderated-report` / `official` / `inference` / `synthetic`)
- `confirmationRequired: true` (always in this tranche)
- failure/recovery guidance
- optional audit event reference

## Challenge example

`suggestChallengeDiscoveryHandoffs` returns suggested next steps after an accessibility barrier observation (review evidence, alternative route, transport information, Day impact preview, community discussion boundary, care information). Every step requires explicit participant confirmation.

## Non-goals

No mutation APIs, no silent rescheduling, no automatic publication of private location data.

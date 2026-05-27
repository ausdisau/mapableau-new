# Participant and Worker Profile System

## Overview

- **Participants** use `ParticipantProfile` + `AccessibilityProfile` (1:1 with `User`).
- **Workers** use org-scoped **`WorkerProfile`** as the single source of truth for marketplace and care operations.

Legacy models `Worker`, `WorkerProvider`, and `WorkerAvailability` are **deprecated**. Application code must not create or update them. Use the migration script to backfill `WorkerProfile` rows.

## Registration

`POST /api/register` accepts `accountType`: `participant` | `support_worker`.

- **Participant:** creates profile shells and redirects to `/dashboard/profile/edit`.
- **Support worker:** creates a personal `Organisation` (`independent_support_worker`), membership, and `WorkerProfile`, then redirects to `/worker/onboarding`.

## Worker self-service APIs

| Route | Description |
|-------|-------------|
| `GET/PATCH /api/worker-profile` | Current user's primary worker profile |
| `GET/PATCH /api/worker-profile/availability` | Availability windows for that profile |

## Provider admin

`Provider.organisationId` links marketplace providers to care organisations. Provider-admin worker lists and edits use `WorkerProfile` via `ensureProviderOrganisation()`.

## Migration

1. Apply migration `20260527140000_profile_system_consolidation`.
2. Run: `npx tsx prisma/scripts/migrate-legacy-workers.ts`

This copies legacy `Worker` data into `WorkerProfile` and `AvailabilityWindow` per linked provider organisation.

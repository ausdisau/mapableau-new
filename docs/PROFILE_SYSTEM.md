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

## Worker–provider affiliation

A worker is affiliated with a provider when they have a `WorkerProfile` on that provider’s organisation (`Provider.organisationId` → `Organisation`).

| Field | Purpose |
|-------|---------|
| `affiliationStatus` | `pending`, `active`, `suspended`, or `ended` |
| `affiliatedAt` / `endedAt` | Lifecycle timestamps |
| `active` | Whether the profile is eligible for rostering |

**Affiliate (direct):** `POST /api/providers/{providerId}/workers/affiliate` with `email` or `userId`. Creates/updates `WorkerProfile` and `OrganisationMember` (`support_worker`).

**End affiliation:** `POST /api/providers/{providerId}/workers/{workerProfileId}/end` sets `affiliationStatus: ended` and `active: false`.

**Worker view:** `GET /api/worker-affiliations` and `/worker/affiliations`.

**Invitations:** `POST /api/providers/{providerId}/workers/invites` returns an `inviteUrl`. Workers open `/worker/invites/{token}` and accept via `POST /api/worker-invites/{token}/accept` (must be signed in with the invited email).

**Permissions:** `canManageProviderWorkers` allows `mapable_admin`, `OrganisationMember` with `provider_admin` on the org, or `ProviderUserRole` `ADMIN`/`MANAGER` for a provider linked to that org.

Apply migrations `20260607000000_worker_affiliation` and `20260607100000_worker_provider_invitation`.

## Migration

1. Apply migration `20260527140000_profile_system_consolidation`.
2. Run: `npx tsx prisma/scripts/migrate-legacy-workers.ts`

This copies legacy `Worker` data into `WorkerProfile` and `AvailabilityWindow` per linked provider organisation.

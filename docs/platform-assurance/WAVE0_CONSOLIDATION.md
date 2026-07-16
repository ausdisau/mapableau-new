# Wave 0 — Consolidation and Baseline

**Date:** 2026-07-16  
**Branch:** `cursor/platform-assurance-registry-ccbf`  
**Status:** Inventory complete for first assurance PR. No production features beyond the Platform Assurance registry.

## Canonical freeze (do not duplicate)

| Domain | Canonical model / module | Notes |
|--------|--------------------------|-------|
| Person / org | `User`, `Organisation`, `OrganisationMember`, `Tenant` | No second identity platform |
| Participant requirements | `AccessibilityProfile` | Never infer from diagnosis |
| Consent | `ConsentRecord`, `lib/consent` | Capsules/presentations bind here later |
| Audit | `AuditEvent`, `lib/audit` | Prefer correlation metadata on write |
| Places | `AccessPlace` (+ location/features/sources) | Prefer over legacy `AccessiblePlace` |
| Workers | `WorkerProfile`, `WorkerTrustCredential` | Mock VC until System 2 ADR |
| Provider trust | `ProviderVerification*` | Org-level |
| Compliance scaffold | `ComplianceControl*` | Mapped by `RegistrationControl.complianceControlCode` |

## Active branch / PR conflict matrix

| Ref | Topic | Risk to this programme |
|-----|-------|------------------------|
| PR #264 | Access Intelligence (Passport, Living Twin, Trust/Safety Kernel) | High schema conflict on `prisma/schema.prisma`; consolidate before Systems 3–10 |
| PR #265 | Access Intelligence Physical Systems | Sensor overlap with System 4 |
| PR #262 | Chat accessibility search | UX only; chat must not be sole interface |
| PR #261 | Accessibility reviews | Extends Access domain |
| PR #260 | Access Lens scaffold | Product naming overlap |
| CareOS identity/authority | Participant authority / outbox patterns | Inventory before new outbox tables |
| CareOS transport command | Transport ops | Coordinate with Systems 3, 5, 9 |

## Adapter inventory (main)

Present: NDIS provider ingest, AusPost PAC, TfNSW config, OSM/MapLibre, Stripe, SendGrid, OSRM flags, trust-passport mock issuer.  
Absent: GTFS, IndoorGML, CDS, SensorThings, WoT, BOM commercial weather, ACT Lab, WAI-Adapt, live screening/banning APIs.

## Exit criteria for Wave 0 (this PR)

- [x] Written consolidation note (this file)
- [x] Conflict matrix recorded
- [x] `RegulatorySourceVersion` design implemented in first PR
- [ ] Full Access Intelligence (#264) merge — deferred; not in this PR scope

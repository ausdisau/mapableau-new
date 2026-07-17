# Assurance (Wave 6)

Internal registration cyber assurance and go-live readiness controls for MapAble NDIS Wave 6.

> **Wave 8 update:** Continuous assurance snapshots and tenant-scoped
> assurance views are documented in
> [`docs/platform/continuous-assurance.md`](../platform/continuous-assurance.md)
> and indexed from
> [`docs/platform/wave-8-governed-production-scale.md`](../platform/wave-8-governed-production-scale.md).
> Env flags never equal assurance readiness. AI does not approve GA.

## Disclaimers

- **Internal readiness ≠ certification, registration, or NDIA approval.**
- **Feature flags ≠ readiness.** Enabling a flag does not mean the platform is ready.
- **No AI agent may sign or approve production go-live.**
- MapAble does **not** claim SOC 2, ISO 27001, or NDIS digital platform certification from these controls.
- No live NDIA submission, myID/RAM credentials, or fabricated certifications.
- Regulatory dates use `RegulatoryDateConfig` keys — not hard-coded NDIA endpoints.

## Overview

| Document | Description |
|----------|-------------|
| [Wave 6 assurance readiness](./wave-6-assurance-readiness.md) | Implementation overview and acceptance criteria |
| [Control frameworks](./control-frameworks.md) | Framework catalogues and seeding |
| [Controls and evidence](./controls-and-evidence.md) | Model overview |
| [Evidence governance](./evidence-governance.md) | Classification, checksums, freshness |
| [Control testing](./control-testing.md) | Test procedures and operating effectiveness |
| [Exceptions](./exceptions.md) | Compensating control exceptions |

## Registration and NDIA

| Document | Description |
|----------|-------------|
| [NDIS digital platform registration](./ndis-digital-platform-registration.md) | Digital platform pathway |
| [Registration group 0137](./registration-group-0137.md) | 0137 group tracking |
| [NDIA digital partnership application](./ndia-digital-partnership-application.md) | Partnership application state |
| [NDIA application index](./ndia-application/README.md) | NDIA docs hub |
| [Registration](./registration.md) | Legacy short reference |
| [NDIA digital partnership](./ndia-digital-partnership.md) | Legacy short reference |

## Trust and eligibility

| Document | Description |
|----------|-------------|
| [Worker screening and platform eligibility](./worker-screening-and-platform-eligibility.md) | Worker trust gates |
| [Banning order governance](./banning-order-governance.md) | Fail-closed banning checks |
| [Credential verification](./credential-verification.md) | Verification levels |
| [Worker platform trust](./worker-platform-trust.md) | Legacy short reference |

## Security and architecture

| Document | Description |
|----------|-------------|
| [Architecture evidence](./architecture-evidence.md) | Drift checks and adapter modes |
| [Architecture index](./architecture/README.md) | Architecture docs hub |
| [Secure SDLC](./secure-sdlc.md) | Release gates |
| [SDLC index](../security/sdlc/README.md) | SDLC ops hub |
| [Vulnerability management](./vulnerability-management.md) | Security findings register |
| [Penetration test readiness](./penetration-test-readiness.md) | External pen-test prep |
| [Privacy and consent](./privacy-and-consent.md) | APP alignment |
| [Privacy](./privacy.md) | Legacy short reference |

## Operations

| Document | Description |
|----------|-------------|
| [Incident response](./incident-response.md) | Incident and exercise tracking |
| [Business continuity](./business-continuity.md) | BC checks and objectives |
| [BC operations](../operations/business-continuity/README.md) | BC ops hub |
| [Disaster recovery](./disaster-recovery.md) | DR objectives |
| [DR operations](../operations/disaster-recovery/README.md) | DR ops hub |
| [Vendor risk](./vendor-risk.md) | Third-party risk assessments |

## Go-live

| Document | Description |
|----------|-------------|
| [Go-live readiness](./go-live-readiness.md) | Production gate |
| [Controlled pilot](./controlled-pilot.md) | Pilot policy (not auto-activated) |
| [Go-live](./go-live.md) | Legacy short reference |

## Runbooks

| Document | Description |
|----------|-------------|
| [Auditor export runbook](./auditor-export-runbook.md) | Export readiness bundle |
| [Assurance migration runbook](./assurance-migration-runbook.md) | Schema backfill sequence |
| [Auditor export](./auditor-export.md) | Legacy short reference |
| [Scripts](./scripts.md) | Script conventions |

## Regulatory references (titles only)

- *How to connect to our systems*
- *Connecting with NDIA systems*
- *Mandatory registration and transition pathways for NDIS digital platforms*
- *Apply for registration*
- *Registration groups or classes of support*
- *NDIS Practice Standards and Quality Indicators*
- *Australian Privacy Principles*

## Admin console

`/admin/assurance` — internal readiness visibility only.

## Wave 8 platform cross-links

| Document | Relevance |
|----------|-----------|
| [Continuous assurance](../platform/continuous-assurance.md) | Tenant assurance snapshots (not certification) |
| [General availability readiness](../platform/general-availability-readiness.md) | Advisory GA assessment |
| [Regulatory change management](../platform/regulatory-change-management.md) | Human-reviewed regulatory cases |
| [Tenant policy profiles](../platform/tenant-policy-profiles.md) | Versioned policy binding |
| [Wave 8 migration runbook](../platform/wave-8-migration-runbook.md) | Backfill sequence |

## See also

[Disclaimers](./disclaimers.md)

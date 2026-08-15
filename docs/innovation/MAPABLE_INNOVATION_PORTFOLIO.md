# MapAble Innovation Portfolio

**Programme:** MapAble — Australian Disability Ltd  
**Artefact type:** Delivery-ready portfolio documentation (not production readiness)  
**Branch intent:** `docs/innovation/` only  
**Azure DevOps:** Import-ready representation only — **no live work items created** in this pass  
**Feature freeze:** Active — see `docs/remediation/FEATURE_FREEZE.md`. Implementation of Epics requires waiver or freeze lift.

## Operating principles

Design every Epic around:

- participant choice, autonomy and decision ownership;
- dignity of risk rather than paternalistic risk elimination;
- supported decision-making;
- purpose-bound consent;
- privacy and minimum-necessary disclosure;
- accessible communication, including AAC;
- WCAG 2.2 AA as a release criterion (manual AT required; axe alone insufficient);
- human escalation for consequential decisions;
- auditable provenance;
- feature flags and safe rollback;
- non-AI fallback paths;
- evidence before prediction.

Claim states used: Verified live · Implemented, not independently verified · In development · Proposed · Exploratory · Historical.

Honesty sources: `docs/convergence-os/PUBLIC_CLAIM_REGISTRY.md`, `docs/productisation/CAPABILITY_REGISTRY.md`, `docs/ai-platform/CURRENT_STATE.md`, `lib/transport/feature-status.ts`.

## Architectural north star

**Accessibility infrastructure + participant-controlled service orchestration.**

Flywheel: Map → Access Graph → Personal Access Passport → Accessible Navigation → Service Orchestration → Care / Transport / Jobs → Outcomes and evidence → Improved Access Graph.

Shared Core — extend existing SoT; do not duplicate identity, consent, messaging, audit, complaints, credential, billing, or accessibility systems inside verticals.

## Repository state inspected (summary)

| Area | Finding |
| --- | --- |
| Stack | pnpm 10, Next.js 15 App Router, Prisma 6, PostgreSQL, NextAuth |
| Apps | `app/` web, `apps/companion` Expo scaffold, `apps/realtime-server` |
| Schema | `prisma/schema.prisma` (~721 models); AccessPlace, AccessPassport, evidence envelopes present |
| Verticals | Care, Transport (`TransportTrip` SoT), Jobs, Billing, Access, Accreditation, Messaging, Incidents |
| AI | Capability registry; Navigator under W-AA-1; public AI claims false |
| CI | GitHub Actions (no Azure Pipelines); production-claims + accessibility workflows |
| Deploy | Vercel + Neon; Azure AD OAuth only (not Azure DevOps) |
| Freeze | Active; documentation permitted |

## Shared Core reuse map

| Requested concept | Repository mapping / disposition |
| --- | --- |
| User | User — REUSE `prisma` User + NextAuth |
| Organisation | Organisation / OrganisationMember — REUSE |
| Role | MapAbleUserRole + UserRoleAssignment — REUSE (no Role model) |
| Membership | OrganisationMember / TenantMembership — REUSE |
| DelegateGrant | ParticipantAuthorityGrant + DelegateInvitation — EXTEND (do not create DelegateGrant) |
| ParticipantProfile | ParticipantProfile — REUSE |
| AccessibilityPreference | AccessibilityProfile (presentation) vs AccessPassport (functional) — REUSE both; keep separation C-010 |
| CommunicationPreference | JSON on AccessibilityProfile + types — EXTEND if G1 requires first-class record |
| MobilityAid | JSON / AccessRequirement domain equipment_at — EXTEND; optional AtEquipmentAsset for AT Continuity |
| ConsentRecord | ConsentRecord — REUSE lib/consent |
| DataPurpose | purpose string on consent/authority — EXTEND toward typed DataPurpose if needed |
| DisclosureReceipt | ConsentReceipt — EXTEND (tenant, field list, expiry/supersession gaps) |
| Provider / Worker | Provider / Worker / WorkerProfile — REUSE |
| Credential | WorkerTrustCredential + TrainingCompletionRecord — EXTEND network |
| Place | AccessPlace (C-011 sole place identity) — REUSE |
| AccessFeature | AccessPlaceFeature / AccessCapabilityRecord — REUSE/EXTEND |
| AccessObservation | AccessObservationRecord + AccessEvidenceEnvelopeRecord — REUSE/EXTEND |
| Verification | AccessProvenanceStatus + change review — REUSE/EXTEND |
| AccreditationAssessment | AccessAccreditation* + ProviderAccreditation* — REUSE |
| ServiceOffering / Availability / Care* | lib/care CareRequest/CareShift — REUSE |
| Trip / Vehicle / Driver | TransportTrip* + Vehicle/Driver — REUSE TransportTrip as SoT |
| Employer / Job / Application | Job / JobApplication — REUSE |
| AdjustmentRequest | InterviewAdjustmentRequest + AccessAdjustmentRecord — REUSE/EXTEND |
| MessageThread / Notification | Conversation/Message — REUSE; notifications often stubbed — EXTEND |
| SupportTicket / Complaint / Incident | Complaint / IncidentReport — REUSE |
| Funding / Quote / Invoice / Payment | BillingInvoice / AbilityPay / Stripe — REUSE; live NDIA submit OFF |
| Document / EvidenceItem / AuditEvent / FeatureFlag | existing evidence + AuditEvent + fail-closed flags — REUSE |

## 15-Epic summary

| ID | Title | Priority | Wave | Claim state | Depends on |
| --- | --- | --- | --- | --- | --- |
| 01 | MapAble Access Graph | P0 | Foundation Wave | In development | — |
| 02 | Personal Access Passport | P0 | Foundation Wave | In development | 01 |
| 03 | MapAble Navigate | P1 | Experience Wave | In development | 01, 02 |
| 04 | Access Intelligence Vision | P3 | R&D Wave | Exploratory | 01, 06 |
| 05 | Accessibility Digital Twins | P3 | R&D Wave | Exploratory | 01, 03 |
| 06 | MapAble Accreditation OS | P0 | Foundation Wave | Implemented, not independently verified | 01, 09 |
| 07 | Participant Orchestration Agent | P1 | Controlled Intelligence Wave | In development | 01, 02, 03, 08 |
| 08 | Accessible Communications Fabric | P1 | Experience Wave | Implemented, not independently verified | 02 |
| 09 | Trust & Credential Network | P0 | Foundation Wave | Implemented, not independently verified | — |
| 10 | Funding & Payment Integrity Engine | P2 | Controlled Intelligence Wave | In development | 09 |
| 11 | Employment Accessibility Graph | P2 | Participation Wave | In development | 01, 02, 03 |
| 12 | Circular Assistive Technology Network | P3 | R&D Wave | Exploratory | 02, 09 |
| 13 | MapAble Access API | P2 | Platform Commercialisation Wave | Proposed | 01, 06 |
| 14 | MapAble Access Observatory | P2 | Platform Commercialisation Wave | Proposed | 01, 11 |
| 15 | MapAble Academy + Capability Passport | P2 | Participation Wave | Implemented, not independently verified | 09 |

## Delivery sequence

1. **Foundation:** 01 Access Graph (P0), 02 Passport, 06 Accreditation OS, 09 Credentials, thin 08 messaging/prefs  
2. **Experience:** 03 Navigate, remaining 08 channels  
3. **Controlled intelligence:** 07 Orchestration Agent, 10 Funding integrity  
4. **Participation:** 11 Employment graph, 15 Academy  
5. **Commercialisation:** 13 Access API, 14 Observatory  
6. **R&D:** 04 Vision, 05 Digital Twins, 12 Circular AT  

**Tweak vs default:** Epic 08 thin slice can start in Foundation because the first vertical slice needs accessible status/escalation. Epic 05 has more indoor code than Epic 04 but both stay R&D — schema ≠ live personal safety truth.

## First vertical slice — Accessible Appointment / Employment Journey

Smallest cross-Epic set: **01 + 02 + 03 + 07 + thin 08**, plus existing Care and Transport — **not** full 11/04/05/12/13/14.

Behaviour: understand requirements → destination evidence + confidence → accessible routes → compatible transport/optional support → draft plan → participant approval → execute approved actions only → status updates → cancel/change → human escalate → outcomes/corrections.

Rule: **MODEL PROPOSES → POLICY SERVICES VALIDATE → PARTICIPANT DECIDES → AUTHORISED SYSTEM EXECUTES.**

## Security programme note (agent orchestration risks)

When Epics that accept free-text or expose APIs are implemented, enforce layered controls consistent with platform hardening:

- Edge middleware interception for `/api`, `/admin`, `/dashboard` (rate limit, AI scraper UA drop, prompt-injection query sanitization);
- `verifyPayloadSafe` isolation filter before Prisma mutations on free-text;
- `public/ai.txt` and `public/robots.txt` data boundary maps for transactional endpoints.

These are **implementation controls for later code PRs**, not claimed complete by this documentation portfolio.

## Recommended next implementation Epic

**EPIC 01 — MapAble Access Graph** (after freeze waiver + G0/G1).

## Exact next Codex action

1. Human validate this portfolio (duplication, ownership, sequence).  
2. Do **not** create Azure DevOps work items until validated (`AZURE_DEVOPS_IMPORT.md`).  
3. Next implementation PR: narrow Access Graph provenance/freshness/verification slice on existing `AccessPlace` / evidence envelope writers — not a new graph DB, not Vision, not API commercialisation.  
4. Run `pnpm setup:cloud-agent`, `pnpm type-check`, `pnpm build` before any code PR merge.

## Epic files

- [EPIC 01 — MapAble Access Graph](./epics/01-access-graph.md)
- [EPIC 02 — Personal Access Passport](./epics/02-personal-access-passport.md)
- [EPIC 03 — MapAble Navigate](./epics/03-navigate.md)
- [EPIC 04 — Access Intelligence Vision](./epics/04-access-intelligence-vision.md)
- [EPIC 05 — Accessibility Digital Twins](./epics/05-accessibility-digital-twins.md)
- [EPIC 06 — MapAble Accreditation OS](./epics/06-accreditation-os.md)
- [EPIC 07 — Participant Orchestration Agent](./epics/07-participant-orchestration-agent.md)
- [EPIC 08 — Accessible Communications Fabric](./epics/08-accessible-communications-fabric.md)
- [EPIC 09 — Trust & Credential Network](./epics/09-trust-credential-network.md)
- [EPIC 10 — Funding & Payment Integrity Engine](./epics/10-funding-payment-integrity.md)
- [EPIC 11 — Employment Accessibility Graph](./epics/11-employment-accessibility-graph.md)
- [EPIC 12 — Circular Assistive Technology Network](./epics/12-circular-assistive-technology.md)
- [EPIC 13 — MapAble Access API](./epics/13-access-api.md)
- [EPIC 14 — MapAble Access Observatory](./epics/14-access-observatory.md)
- [EPIC 15 — MapAble Academy + Capability Passport](./epics/15-academy-capability-passport.md)

## Related programme files

- [PORTFOLIO_DEPENDENCY_MAP.md](./PORTFOLIO_DEPENDENCY_MAP.md)
- [PORTFOLIO_STAGE_GATES.md](./PORTFOLIO_STAGE_GATES.md)
- [PORTFOLIO_KPIS.md](./PORTFOLIO_KPIS.md)
- [PORTFOLIO_RISK_REGISTER.md](./PORTFOLIO_RISK_REGISTER.md)
- [PORTFOLIO_ROADMAP.md](./PORTFOLIO_ROADMAP.md)
- [AZURE_DEVOPS_IMPORT.md](./AZURE_DEVOPS_IMPORT.md)
- [azure-devops-portfolio.json](./azure-devops-portfolio.json)

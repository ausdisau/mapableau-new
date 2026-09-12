# MapAble Communication Platform — Labs, Data Residency and Security Addendum

**Date:** 2026-09-12  
**Status:** Approved architectural constraint — not implemented  
**Applies to:** `docs/superpowers/specs/2026-09-12-mapable-communication-access-design.md`

## 1. Decision

The MapAble Communication Platform will be housed within **MapAble Labs** during research, co-design, validation and personalised-speech development.

The participant-facing experimental surface will use the existing MapAble Labs origin and routing model:

- `https://labs.mapable.com.au/communication`
- explicit preview/testing route: `/labs/communication`

MapAble Labs remains visibly experimental. No Labs capability may be represented as a validated production assistive communication system until the applicable accessibility, privacy, security, model-evaluation and operational-readiness gates are passed.

## 2. Australian data residency contract

Communication data is treated as high-sensitivity participant-controlled data.

The following must be stored and processed in Australian regions only:

- raw audio recordings;
- derived audio features and embeddings;
- transcripts that contain participant content;
- Communication Passport and saved-phrase content used by the Labs platform;
- speech-training prompts linked to a participant;
- consent definitions, decisions and immutable consent snapshots;
- model-training datasets containing participant speech;
- participant-specific model artefacts or adapters;
- inference inputs/outputs containing participant speech or transcript content;
- audit records that contain participant-linked communication events;
- backups, point-in-time recovery data and disaster-recovery copies of the above;
- operational logs containing any of the above.

Public experiment copy, static assets, synthetic test fixtures and non-identifying build artefacts are outside this sensitive-data class.

### Target regions

The existing infrastructure baseline already specifies:

- primary: AWS `ap-southeast-2` (Sydney);
- disaster recovery: AWS `ap-southeast-4` (Melbourne).

Communication data must not use cross-region replication, backup or failover outside those Australian regions.

### Vercel boundary

The existing MapAble Labs Next.js shell may continue to be served through the current web deployment, but **raw audio, transcripts, model artefacts and participant-linked communication content must not be persisted in Vercel storage or logs**.

The preferred flow is:

```text
labs.mapable.com.au UI
        |
        | short-lived AU-enclave capability request
        v
Australian Communication API
        |
        +--> direct signed upload --> private AU object storage
        +--> AU metadata store
        +--> AU inference/training workers
```

No raw audio upload should transit through a generic Next.js/Vercel API route.

### Residency verification gate

Before participant persistence is enabled, a deployment evidence pack must verify:

1. service region;
2. storage region;
3. database region;
4. backup/DR region;
5. logging region;
6. key-management region;
7. model-training/inference region;
8. subprocessor and support-access implications;
9. whether any telemetry or error-reporting product receives participant content.

If a supplier cannot support the stated residency boundary, participant content must not be sent to that supplier.

## 3. Canonical data ownership

Do not create a second communication identity or second passport source of truth.

The existing MapAble model already contains:

- `AccessibilityProfile` for presentation/access preferences;
- `CommunicationPassport` plus `PreferredQuestion`, `SavedPhrase`, `AacMethodPreference` and `EmergencyCommunicationCard`;
- `lib/support/communication-passport` projection logic;
- `lib/communication/` server-authoritative communication services;
- `lib/platform/speech/` provider contracts;
- `lib/intelligence/voice/` voice intents and mandatory confirmation gates.

The Labs integration extends these capabilities. Speech-specific persistence may use a dedicated Australian-resident data enclave, keyed by opaque MapAble participant/passport references, but it must not fork the participant's communication preferences into a competing source of truth.

## 4. Essential Eight security target

The Essential Eight is a baseline, not a complete cloud-application security framework. MapAble will target **Essential Eight Maturity Level 2** for the organisational and technical environment supporting persistent participant communication data before any production-style Labs pilot.

No claim of Essential Eight compliance or certification may be made solely from code or cloud configuration. Readiness must be assessed against ASD's current Essential Eight maturity model and assessment guidance.

### Control mapping

1. **Application control**
   - approved deployment artefacts only;
   - signed/traceable CI builds;
   - production workloads do not permit arbitrary participant-supplied code execution;
   - administrative endpoints are accessed from managed devices with application-control policy.

2. **Patch applications**
   - dependency and container vulnerability scanning in CI;
   - internet-facing critical vulnerabilities are triaged and remediated within the applicable ASD maturity-model timeframe;
   - unsupported Euphonia reference dependencies are not imported into the MapAble runtime.

3. **Configure Microsoft Office macros**
   - applies to organisational/admin workstations rather than the web service;
   - macros are disabled unless there is an approved business requirement;
   - internet-origin macros are blocked;
   - research/admin workflows must not depend on unsigned macro automation.

4. **User application hardening**
   - managed browsers for privileged/research administration;
   - CSP and secure browser headers for Labs;
   - unnecessary browser plugins and legacy scripting features disabled on managed endpoints;
   - participant UI has a standard non-AI fallback.

5. **Restrict administrative privileges**
   - separate privileged and normal accounts;
   - least privilege and just-in-time access where supported;
   - no standing database/object-storage administrator access for routine work;
   - break-glass access is separately controlled, logged and reviewed;
   - production communication data access is auditable.

6. **Patch operating systems**
   - supported OS/container base images only;
   - automated vulnerability reporting;
   - documented patch ownership and remediation windows;
   - no abandoned Euphonia runtime images or Node 16-era deployment assumptions.

7. **Multi-factor authentication**
   - MFA is mandatory for administrators, researchers and privileged operators;
   - phishing-resistant MFA is preferred for privileged accounts;
   - participant authentication must remain accessible and must not rely on a single inaccessible factor;
   - sensitive export, model activation and destructive actions require step-up authentication.

8. **Regular backups**
   - encrypted Australian-region backups;
   - point-in-time recovery for metadata;
   - object versioning/retention appropriate to consent and deletion rules;
   - unprivileged users cannot modify backups;
   - restoration is tested, not merely configured;
   - withdrawal/deletion procedures explicitly address live data, replicas and backup retention.

## 5. Additional controls beyond Essential Eight

Because speech and communication data may be sensitive personal information, the platform also requires:

- encryption in transit and at rest;
- customer-managed or tightly governed cloud KMS keys in Australian regions;
- private storage with public-access blocks;
- short-lived signed upload/download URLs;
- WAF/rate limiting on public APIs;
- secrets management with no repository secrets;
- network segmentation between public API, metadata, storage and model workers;
- immutable audit events for privileged access and consent actions;
- privacy-by-design data minimisation;
- retention and deletion enforcement;
- incident response and Notifiable Data Breaches readiness;
- independent penetration testing before a production-style pilot;
- dependency/SAST/secret scanning and SBOM generation;
- model evaluation for recognition quality across speech phenotypes before activation.

## 6. Privacy boundary

Australian residency is a stronger internal policy choice; it does not replace Privacy Act obligations.

The implementation must support:

- APP 6 purpose limitation;
- APP 8 controls if any future overseas disclosure is proposed;
- APP 11 reasonable security, destruction and de-identification obligations;
- current and specific consent for optional research/model-training uses;
- clear withdrawal handling;
- no use of communication data for advertising, eligibility, capability scoring or unrelated profiling.

## 7. Labs-to-production promotion gate

A Labs communication capability may be promoted beyond experimental status only when all applicable evidence exists:

- WCAG 2.2 AA automated and manual accessibility checks pass;
- participant co-design findings have been reviewed;
- Australian data residency evidence is complete;
- privacy impact assessment is approved;
- threat model and security review are approved;
- Essential Eight ML2 assessment evidence is available for the supporting environment;
- penetration testing has no unresolved critical/high findings;
- backup restoration has been demonstrated;
- consent/withdrawal/deletion tests pass;
- speech recognition evaluation meets an approved quality threshold for the intended cohort;
- a human/non-speech fallback exists;
- consequential actions still require accessible confirmation;
- no Google partnership or Project Euphonia support claim is made.

## 8. Authoritative references

- ASD/ACSC Essential Eight maturity model: https://www.cyber.gov.au/business-government/asds-cyber-security-frameworks/essential-eight/essential-eight-maturity-model
- ASD/ACSC Essential Eight explained: https://www.cyber.gov.au/business-government/asds-cyber-security-frameworks/essential-eight/essential-eight-explained
- OAIC APP 8 guidance: https://www.oaic.gov.au/privacy/australian-privacy-principles/australian-privacy-principles-guidelines/chapter-8-app-8-cross-border-disclosure-of-personal-information
- OAIC APP 11 guidance: https://www.oaic.gov.au/privacy/australian-privacy-principles/australian-privacy-principles-guidelines/chapter-11-app-11-security-of-personal-information

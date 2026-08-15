# Portfolio Dependency Map

## Epic dependency graph

```mermaid
flowchart TB
  e01[01 Access Graph]
  e02[02 Passport]
  e06[06 Accreditation OS]
  e09[09 Credentials]
  e08[08 Communications]
  e03[03 Navigate]
  e07[07 Orchestration]
  e10[10 Funding Integrity]
  e11[11 Employment Graph]
  e15[15 Academy]
  e13[13 Access API]
  e14[14 Observatory]
  e04[04 Vision]
  e05[05 Digital Twins]
  e12[12 Circular AT]
  e01 --> e02
  e01 --> e03
  e02 --> e03
  e01 --> e06
  e09 --> e06
  e02 --> e08
  e01 --> e07
  e02 --> e07
  e03 --> e07
  e08 --> e07
  e09 --> e10
  e01 --> e11
  e02 --> e11
  e03 --> e11
  e09 --> e15
  e01 --> e13
  e06 --> e13
  e01 --> e14
  e11 --> e14
  e01 --> e04
  e06 --> e04
  e01 --> e05
  e03 --> e05
  e02 --> e12
  e09 --> e12
```

## Shared Core links (do not rebuild)

- Identity/auth — lib/auth
- Consent/receipts — lib/consent
- Authority/delegates — lib/authority + DelegateInvitation
- Audit — lib/audit
- Messaging — lib/messages
- Complaints/incidents — Complaint / IncidentReport
- Credentials — WorkerTrustCredential
- Feature flags — fail-closed env flags
- Access place identity — AccessPlace C-011
- Access passport — AccessPassport C-010

## Feature-level predecessor notes

| Epic | Must precede Features in |
| --- | --- |
| 01 | 02 taxonomy refs, 03 journey evaluate, 06 graph publish, 11 workplace profiles, 13/14 aggregates, 04/05 evidence |
| 02 | 03 fit, 07 tools, 08 prefs, 11 disclosure, 12 AT share |
| 09 | 06 assessor identity, 10 trust signals, 15 credential link, 12 partner trust |
| 03 + thin 08 | 07 first vertical slice |
| 06 | 04 assessor validation, 13 verified payloads |

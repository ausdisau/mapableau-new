# ContinuityOS canonical domain map

| Concept | Canonical | ContinuityOS role |
|---------|-----------|-------------------|
| Person | `User` | Participant ownership |
| Tenancy | `Organisation` / membership | Org continuity metrics only |
| Mission | `CareOSMission` | SoT; life-event extension child |
| Presentation prefs | `AccessibilityProfile` | Optional reference |
| Functional access | AccessPassport (`AiAccessPassport` on AI branches) | Selected passport id on extension |
| Consent / purpose | `ConsentRecord` / RightsOS | Required for disclosures |
| Vault | Personal Access Vault | Minimal reusable fields |
| AI proposals | `AuraActionProposal` (when merged) | Linked via `RecoveryActionLink` |
| Care recovery | `BackupShiftRecovery` | Option type may prepare call |
| Transport | `TransportTrip*` | Failure signals / options only |
| Incidents | `IncidentReport` | Link only |
| Complaints | `Complaint` | Rights route |
| Audit | `AuditEvent` | All consequential transitions |

**Rule:** No second mission, incident, complaint, care or transport database.

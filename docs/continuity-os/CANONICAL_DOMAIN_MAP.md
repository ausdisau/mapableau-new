# ContinuityOS Canonical Domain Map

| Concept | Canonical | ContinuityOS role |
|---------|-----------|-------------------|
| Person | `User` | Participant ownership |
| Tenancy | `Organisation` / membership | Optional tenantId on mission |
| Mission | `CareOSMission` | SoT; ContinuityOS extends |
| Mission events | `CareOSMissionEvent` | Audit stream |
| Life event | `LifeEventMissionExtension` | ContinuityOS owned |
| Presentation prefs | `AccessibilityProfile` | Reuse |
| Functional requirements | AccessPassport (when merged) | Hard requirements for options |
| Consent | `ConsentRecord` | Gate disclosures |
| Care recovery | `BackupShiftRecovery` | Linked writer |
| Transport | `TransportTrip` | Linked writer |
| Incidents / complaints | `IncidentReport`, `Complaint` | Escalate; never close via ContinuityOS |
| Audit | `AuditEvent` | All consequential transitions |
| Continuity scores | `ContinuityMetricSnapshot` | **Do not use in ContinuityOS participant UX** |

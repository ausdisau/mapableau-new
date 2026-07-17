# Registration control matrix

Seeded via `RegistrationControl` / `lib/platform-assurance/control-catalogue.ts`.

| Code | Category | Intent |
|------|----------|--------|
| PA-GOV-001 | governance | Accountability ownership |
| PA-SCOPE-001 | scope | Versioned applicability assessment |
| PA-SCREEN-001 | worker_screening | Screening evidence or explicit unavailable |
| PA-BAN-001 | worker_screening | Banning-order checks (unavailable until adapter exists) |
| PA-INC-001 | incidents | Incident evidence |
| PA-COMP-001 | complaints | Complaints evidence |
| PA-FEE-001 | fees | Fee transparency |
| PA-REL-001 | relationships | Service relationship disclosure |
| PA-PRIV-001 | privacy | Privacy / information management |
| PA-SEC-001 | security | Platform security readiness |

Controls may reference `ComplianceControl.code` via `complianceControlCode`. Presence of rows is an inventory, not certification.

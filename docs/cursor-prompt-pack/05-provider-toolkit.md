# MapAble Provider Toolkit — Cursor prompt pack

## 1. Product purpose

Lightweight operational toolkit for small providers: rosters, service logs, invoices, incidents, compliance docs, participant communication.

## 2. User roles

| Role | Capabilities |
|------|----------------|
| Small provider owner | Full workspace |
| Worker | Log shifts, incidents |
| MapAble admin | Template library |

## 3. MVP features

- `ToolkitWorkspace` per organisation (lite mode flag)
- Provider roster CSV import / manual rows
- Service log entry (date, participant ref, hours, notes)
- Incident from template → link Core `Incident`
- Compliance checklist instance (NDIS registration items)
- Invoice template → export line items (PDF later)
- Participant comms: message draft → Core messaging with confirm

## 4. Later features

- Open-source export bundle
- Xero sync
- Mobile offline logs

## 5. Database tables

`ToolkitWorkspace`, `ProviderRosterEntry`, `ServiceLog`, `IncidentTemplate`, `ComplianceChecklist`, `ComplianceChecklistItem`, `InvoiceTemplate`

## 6. API routes

```
GET/POST /api/toolkit/workspace
GET/POST /api/toolkit/roster
GET/POST /api/toolkit/service-logs
GET/POST /api/toolkit/incidents/from-template
GET/POST /api/toolkit/compliance/checklists
GET      /api/toolkit/invoice-templates
```

## 7. Frontend

- `app/provider/toolkit/page.tsx`, `roster`, `logs`, `compliance`, `incidents`
- `components/toolkit/ServiceLogForm`, `ChecklistProgress`, `RosterTable`

## 8. Integrations

Provider Portal, Billing, Compliance/Audit, Worker App (read service logs).

## 9. Accessibility

- Simple wizards, one task per screen
- Printable checklist view

## 10. Privacy

- Participant identifiers pseudonymous in roster until linked to Core user with consent

## 11. Audit

`toolkit.log.created`, `toolkit.incident.raised`, `toolkit.checklist.completed`

## 12. Tests

- Template incident maps to Core incident schema
- Org scope on all logs

## 13. Seed

1 workspace, 5 roster rows, 2 templates, 1 open checklist.

**Priority #3 — branch:** `cursor/provider-toolkit-mvp-ce11`

# MapAble Emergency — Cursor prompt pack

## 1. Product purpose

Emergency readiness, evacuation support, and crisis response planning for disabled people: profiles, trusted contacts, evacuation plans, transport escalation, critical access notes, disaster alerts, and check-ins.

## 2. User roles

| Role | Capabilities |
|------|----------------|
| Participant | Own profile, contacts, plans, check-ins, alert subscriptions |
| Nominee / guardian | View/update if consent grants `nomineeCanManageEmergency` |
| Support coordinator | Read plans when shared; cannot edit without consent |
| Provider admin | Org-level disaster bulletin publish (if contracted) |
| MapAble admin | Audit, template management, escalation override |

## 3. MVP features

- Emergency profile (mobility, communication, support needs summary)
- Trusted contacts CRUD + primary contact flag
- Evacuation plan (home/work/other) with steps and meeting points
- Critical access notes (medication list text, equipment, communication card)
- Emergency transport request → draft Transport booking + notify contacts
- Manual check-in (“I’m safe” / “I need help”) with optional geolocation stub
- Subscribe to disaster alerts by region (adapter-fed or manual admin posts)
- Participant dashboard hub + printable Easy Read one-pager export (PDF adapter later)

## 4. Later features

- Automated BOM/disaster API ingestion
- SMS/voice blast to contacts
- Integration with state emergency services APIs
- Wearable / device check-in webhooks
- Multi-language evacuation audio

## 5. Database tables (Prisma)

`EmergencyProfile`, `EmergencyContact`, `EvacuationPlan`, `EvacuationPlanStep`, `EmergencyTransportRequest`, `CriticalAccessNote`, `EmergencyCheckIn`, `DisasterAlert`, `DisasterAlertSubscription`

Key fields: `participantId`, `planType`, `stepsJson` or normalized steps, `lastCheckInAt`, `escalationStatus`, `alertSeverity`, `regionCode`.

## 6. API routes

```
GET/PUT  /api/emergency/profile
GET/POST /api/emergency/contacts
PATCH/DELETE /api/emergency/contacts/[contactId]
GET/POST /api/emergency/evacuation-plans
GET/PATCH /api/emergency/evacuation-plans/[planId]
GET/POST /api/emergency/critical-notes
POST     /api/emergency/transport-requests
POST     /api/emergency/check-ins
GET      /api/emergency/alerts
POST     /api/emergency/alerts/subscribe
GET      /api/admin/emergency/check-ins  (admin queue)
```

## 7. Frontend pages / components

- `app/dashboard/emergency/page.tsx` — hub
- `app/dashboard/emergency/profile`, `contacts`, `plans/[planId]`, `check-in`
- `components/emergency/EmergencyProfileForm`, `TrustedContactList`, `EvacuationPlanEditor`, `CheckInButton`, `DisasterAlertBanner`, `CriticalNotesPanel`

## 8. Integrations

| System | Use |
|--------|-----|
| Participant Portal | Dashboard nav, profile link |
| Transport | `EmergencyTransportRequest` → `createTransportBooking` priority flag |
| Messaging | Notify trusted contacts on “need help” |
| Notifications | Push/email for alerts and check-in reminders |
| Compliance/Audit | All escalations logged |

## 9. Accessibility requirements

- Large touch targets for check-in (min 44px)
- High-contrast “Need help” vs “I’m safe”
- Screen reader announces escalation state
- Easy Read plan summary toggle
- No sole reliance on colour for alert severity (icon + text)

## 10. Privacy and consent rules

- Contacts store name/phone/email only with participant attestation
- Geolocation opt-in per check-in
- Coordinators see plans only if `sharedWithCoordinator`
- **Human review** before any auto-contacting public emergency services (MVP: show call 000 guidance only)

## 11. Audit events

`emergency.profile.updated`, `emergency.contact.added`, `emergency.plan.published`, `emergency.checkin.created`, `emergency.checkin.escalated`, `emergency.transport.requested`, `emergency.alert.subscribed`

## 12. Test cases

- Nominee cannot read profile without consent flag
- “Need help” creates audit + notification payload
- Transport request requires confirmed pickup address
- Alert subscription dedupes region codes
- Evacuation plan validates at least one step

## 13. Seed / demo data

- Demo participant with 2 contacts, home evacuation plan, sample disaster alert (NSW test region)
- One open check-in and one resolved

---

**Cursor instruction:** Implement MVP on branch `cursor/emergency-mvp-ce11`. Follow `00-universal-meta-prompt.md`.

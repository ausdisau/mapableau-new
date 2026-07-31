# MapAble Volunteers — Cursor prompt pack

## 1. Product purpose

Volunteer matching for mapping days, access audits, peer support; verification and hours tracking.

## 2. User roles

| Role | Capabilities |
|------|----------------|
| Volunteer | Profile, apply, log hours |
| Opportunity host | Admin/provider |
| MapAble admin | Verify volunteers |

## 3. MVP features

- `VolunteerProfile` + verification status
- `VolunteerOpportunity` list
- `VolunteerApplication` workflow
- `MappingDayEvent` + `AccessAuditTask`
- `VolunteerHours` entry with approver
- Link audit tasks to Accessibility Mapping (stub coords)

## 4. Later features

- Background check adapter
- Badges / certificates

## 5. Database tables

`VolunteerProfile`, `VolunteerOpportunity`, `VolunteerApplication`, `MappingDayEvent`, `AccessAuditTask`, `VolunteerHours`

## 6. API routes

```
GET/POST /api/volunteers/profile
GET      /api/volunteers/opportunities
POST     /api/volunteers/opportunities/[id]/apply
GET/POST /api/volunteers/hours
GET      /api/admin/volunteers/applications
POST     /api/admin/volunteers/verify/[profileId]
```

## 7. Frontend

- `app/volunteers/page.tsx`, `dashboard/volunteers/hours`
- `components/volunteers/OpportunityCard`, `HoursLogForm`

## 8. Integrations

Accessibility Mapping, Community, Events, Compliance.

## 9. Accessibility

- Opportunity details readable structure
- Low-vision map task alternative text instructions

## 10. Privacy

- Volunteer home address never public

## 11. Audit

`volunteers.application.submitted`, `volunteers.hours.approved`, `volunteers.verified`

## 12. Tests

- Unverified cannot be assigned audit task
- Hours require approved application

## 13. Seed

3 opportunities, 1 mapping day, 2 demo volunteers.

**Branch:** `cursor/volunteers-mvp-ce11`

# Shared architecture — all ecosystem verticals

## Core systems (reuse, do not reimplement)

| System | Location / pattern |
|--------|-------------------|
| Identity & roles | `lib/auth/*`, `User`, `MapAbleUserRole` |
| Permissions | `lib/auth/permissions.ts` — add `{{slug}}:read:self` etc. when needed |
| API auth | `requireApiSession`, `requireApiPermission` in `lib/api/auth-handler.ts` |
| Page auth | `requireAuth`, `requireAdmin` in `lib/auth/guards.ts` |
| Audit | `createAuditEvent` in `lib/audit/audit-event-service.ts` |
| Bookings | `lib/bookings/booking-service.ts` |
| Transport | `lib/transport/transport-booking-service.ts` |
| Notifications | `lib/notifications/*`, `app/api/notifications` |
| Messaging | support tickets / messages patterns under `app/api/support`, `app/dashboard/messages` |
| Consent | `app/dashboard/consent`, consent flags on share flows |
| Accessibility profile | `app/api/accessibility-profile`, `lib/accessibility/*` |
| Provider directory | search/providers, provider finder |
| AI Intake | orchestration routes under `app/api/orchestration` |
| Billing / invoices | `lib/billing/*`, `app/api/invoices` |
| Incidents / safeguarding | `app/api/incidents`, escalation to `incident:manage:any` |

## Suggested module layout

```
prisma/schema.prisma          # models
prisma/migrations/...         # SQL
types/{{slug}}.ts
lib/validation/{{slug}}.ts
lib/{{slug}}/*-service.ts
lib/adapters/{{adapter}}.ts   # optional
app/api/{{slug}}/...
app/dashboard/{{slug}}/...
components/{{slug}}/...
tests/{{slug}}.test.ts
prisma/seed-{{slug}}.ts
```

## Permission naming convention

- `{{slug}}:read:self` — participant owns record
- `{{slug}}:manage:self` — participant create/update own
- `{{slug}}:read:org` — provider org scope
- `{{slug}}:manage:org` — provider org manage
- `{{slug}}:manage:any` — platform admin

## Audit event naming

`{{slug}}.<entity>.<action>` — e.g. `emergency.evacuation_plan.updated`, `community.post.reported`.

## Accessibility baseline (all verticals)

- WCAG 2.2 AA target: focus rings, labels, `aria-live` for async status
- No time-only inputs without date fallback
- Support `prefers-reduced-motion`
- Easy Read variant where product spec calls for it (News, Emergency summaries)
- Screen-reader friendly tables (proper `<th scope>`) or card lists as alternative

## Consent patterns

- `shareWithNominee`, `shareWithProvider`, `shareWithCoordinator` booleans on profiles
- Check `lib/consent` / participant consent records before exporting or publishing
- Public advocacy / community posts: **explicit publish consent** timestamp + actor

## Grouped architecture (product)

| Group | Modules |
|-------|---------|
| Safety & daily living | Emergency, Independence, Housing, Foods |
| Community & advocacy | Community, Events, Volunteers, Advocacy, News |
| Provider infrastructure | Cloud, Provider Toolkit, Academy, Insights |
| Intelligent access | Voice Assistant, Grants, Lens, Navigate |

## Suggested build priority (ecosystem gaps)

1. MapAble Independence  
2. MapAble Emergency  
3. MapAble Provider Toolkit  
4. MapAble Academy / DisAcademy  
5. MapAble Housing  

Then: Events, Community, Grants, News, Voice, Insights, Volunteers, Advocacy, Cloud.

Existing spine (already in flight): Care, Transport, Employment, Foods, Moves, Participant dashboard, Provider onboarding.

# MapAble Events — Cursor prompt pack

## 1. Product purpose

Accessible events directory, access ratings, bookings, transport hooks, reminders.

## 2. User roles

| Role | Capabilities |
|------|----------------|
| Participant | Discover, book, review |
| Organiser | Create events (provider/admin) |
| MapAble admin | Feature events |

## 3. MVP features

- Event catalog with `EventAccessFeature` (captioning, Auslan, quiet room)
- `EventReview` after attendance
- `EventBooking` with support notes
- `EventTransportRequest` → Transport draft
- `EventSupportRequest` (companion, access volunteer)
- Reminder notifications

## 4. Later features

- Ticketing adapter
- Community group tie-in

## 5. Database tables

`Event`, `EventAccessFeature`, `EventReview`, `EventBooking`, `EventTransportRequest`, `EventSupportRequest`

## 6. API routes

```
GET  /api/events
GET  /api/events/[id]
POST /api/events/[id]/bookings
POST /api/events/[id]/transport-requests
POST /api/events/[id]/reviews
POST /api/admin/events
```

## 7. Frontend

- `app/events/page.tsx`, `events/[id]`
- `components/events/AccessRatingPanel`, `BookEventForm`, `TransportLinkBanner`

## 8. Integrations

Transport, Care (support worker at event), Accessibility Mapping, Notifications, Community.

## 9. Accessibility

- Access features prominent above fold
- Review form plain language

## 10. Privacy

- Support notes visible to organiser only

## 11. Audit

`events.booking.created`, `events.transport.requested`, `events.review.posted`

## 12. Tests

- Transport hook creates draft booking
- Past event closed for booking

## 13. Seed

4 events (mix online/in-person), access features.

**Branch:** `cursor/events-mvp-ce11`

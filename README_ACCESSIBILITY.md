# Accessibility module (Phase 1)

## Built

- `AccessibilityProfile` model with mobility, communication, sensory, cognitive, transport, and digital preference JSON fields
- Participant pages: `/dashboard/accessibility`, `/dashboard/accessibility/edit`
- Admin view: `/admin/participants/[id]/accessibility` (audit logged)
- API: `GET/PATCH /api/accessibility-profile`
- Reusable `AccessibilityProfileForm` and `AccessibilityPreferenceCard` components

## Sharing

Participants control provider sharing via consent scopes `care.accessibility_share` and `transport.accessibility_share`, or explicit confirmation during booking.

## Phase 2

Provider-scoped filtered views, AAC/Auslan workflow hooks, and interface theme application from digital preferences.

# MapAble Grants / Funding Finder — Cursor prompt pack

## 1. Product purpose

Searchable funding opportunities, eligibility filters, saved grants, application checklists, deadline reminders. **Guidance only — not financial or legal advice.**

## 2. User roles

| Role | Capabilities |
|------|----------------|
| Participant | Search, save, checklist |
| Support coordinator | Shared view when permitted |
| MapAble editor | Maintain opportunities |

## 3. MVP features

- `FundingOpportunity` catalog with filters (state, category, amount band)
- `EligibilityRule` as structured JSON + plain explanation
- Save grant, personal `GrantNote`
- `ApplicationChecklist` per saved grant
- `GrantDeadline` reminders via notifications
- Disclaimer banner on every page

## 4. Later features

- SC coordinator bulk share
- Marketplace equipment cross-links

## 5. Database tables

`FundingOpportunity`, `EligibilityRule`, `SavedGrant`, `ApplicationChecklist`, `ApplicationChecklistItem`, `GrantDeadline`, `GrantNote`

## 6. API routes

```
GET  /api/grants/opportunities
GET  /api/grants/opportunities/[id]
POST /api/grants/saved
GET  /api/grants/saved
PATCH /api/grants/saved/[id]/checklist
POST /api/grants/saved/[id]/reminders
POST /api/admin/grants/opportunities
```

## 7. Frontend

- `app/dashboard/grants/page.tsx`, `opportunities/[id]`, `saved`
- `components/grants/EligibilityPanel`, `DisclaimerBanner`, `ChecklistWidget`

## 8. Integrations

Participant Portal, Marketplace, Coordinator portal (read shared), Notifications.

## 9. Accessibility

- Checklist as semantic `<ol>`
- Eligibility icons + text

## 10. Privacy

- Notes never shared without explicit share action
- **Not legal advice** — logged acknowledgement on first visit

## 11. Audit

`grants.opportunity.viewed`, `grants.saved`, `grants.reminder.set`

## 12. Tests

- Disclaimer required before save
- Eligibility filter logic

## 13. Seed

8 opportunities (equipment, transport, community participation), 2 saved demos.

**Branch:** `cursor/grants-mvp-ce11`

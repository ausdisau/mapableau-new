# MapAble Housing — Cursor prompt pack

## 1. Product purpose

Accessible housing search, SDA/SIL discovery, home modification directory, tenancy resources, housing enquiry workflow.

## 2. User roles

| Role | Capabilities |
|------|----------------|
| Participant | Search, enquire, apply draft |
| Listing manager | CRUD listings (provider or admin) |
| Modification provider | Directory profile |
| Coordinator | Shared enquiries |

## 3. MVP features

- `HousingListing` with `HousingAccessFeature` tags (step-free, wide doors, etc.)
- `SdaSilProfile` subtype fields
- `HomeModificationProvider` directory
- `HousingEnquiry` workflow (submitted → contacted → closed)
- `HousingApplication` draft status
- Tenancy resource links (static content MVP)

## 4. Later features

- Map view, virtual tours
- SIL vacancy matching

## 5. Database tables

`HousingListing`, `HousingAccessFeature`, `ListingAccessFeature`, `SdaSilProfile`, `HomeModificationProvider`, `HousingEnquiry`, `HousingApplication`

## 6. API routes

```
GET  /api/housing/listings
GET  /api/housing/listings/[id]
GET  /api/housing/modification-providers
POST /api/housing/enquiries
GET  /api/housing/enquiries
POST /api/housing/applications
POST /api/admin/housing/listings
```

## 7. Frontend

- `app/housing/page.tsx`, `listings/[id]`, `app/dashboard/housing/enquiries`
- `components/housing/AccessFeatureChips`, `EnquiryForm`, `SdaSilBadge`

## 8. Integrations

Provider Directory, Transport (inspection visit), Marketplace, Coordinator, Participant Portal.

## 9. Accessibility

- Filter panel keyboard friendly
- Feature icons with text labels

## 10. Privacy

- Enquiry shares only fields user selects
- Landlord contact revealed after enquiry accepted

## 11. Audit

`housing.listing.viewed`, `housing.enquiry.submitted`, `housing.application.created`

## 12. Tests

- Enquiry requires consent to share accessibility profile
- Listing search by feature AND

## 13. Seed

5 listings (2 SDA), 3 modification providers.

**Priority #5 — branch:** `cursor/housing-mvp-ce11`

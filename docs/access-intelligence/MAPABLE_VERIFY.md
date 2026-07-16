# MapAble Verify

Venue-facing SaaS for accessibility inventory and operations.

## Routes

- `/verify` · `/verify/venues` · `/verify/venues/[placeId]`  
- `/verify/venues/[placeId]/improvements` (Mutation Studio)  
- `/verify/public-guides/[placeId]`  

## APIs

- `GET /api/verify/venues`  
- `GET /api/verify/venues/:id/inventory`  
- `POST /api/verify/venues/:id/attestations`  

Incidents reuse Operate APIs with venue gates. Improvements reuse mutations preview.

## Rules

- Venue attestations remain `venue_attestation` — never auto-upgrade to assessor verification  
- Entitlement `verify_inventory` required (demo uses enterprise plan)  
- Subscription does not increase accessibility claims  
- Fictional venues labelled clearly  

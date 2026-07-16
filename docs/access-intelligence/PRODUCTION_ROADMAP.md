# Production roadmap

1. ~~Wire Prisma repository for Living Twin, incidents, mutation drafts, learning traces~~  
   - Models: `AiLivingTwinMeta`, `AiTemporalRule`, `AiVenueMutationDraft`, `AiLearningSession`, `AiLearningTraceEvent`, `AiVenueStaffAssignment`, `AiLiveStatusSnapshot`  
   - Factory: `getLivingPersistence()` → memory (demo) or Prisma when `ACCESS_INTELLIGENCE_USE_PRISMA=true` **and** demo mode off  
2. ~~Enforce venue_staff/admin roles via NextAuth (disable demo role bypass)~~  
   - Production ignores `x-access-role` headers  
   - Allow: `mapable_admin` / `provider_admin`, or `AiVenueStaffAssignment`  
   - Demo preview headers only when `ACCESS_INTELLIGENCE_DEMO_MODE` is on (disable with `ACCESS_INTELLIGENCE_ALLOW_DEMO_ROLE_PREVIEW=false`)  
3. ~~Connect live BMS / lift feeds behind typed adapters with last-known evidence fallback~~  
   - `HttpBmsLiveStatusAdapter` + `DemoLiveStatusAdapter`  
   - Cascade: live → snapshot → twin evidence / active incident → unavailable  
   - Set `ACCESS_INTELLIGENCE_BMS_URL` (+ optional `ACCESS_INTELLIGENCE_BMS_API_KEY`) for HTTP feed  

Still mocked/external: live venue messaging, transport GTFS, assessor field apps, vector search. A real BMS is only connected when `ACCESS_INTELLIGENCE_BMS_URL` points at a working endpoint — otherwise the demo adapter is clearly labelled and last-known fallbacks apply.

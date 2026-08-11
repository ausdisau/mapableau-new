# Care adapter (Phase 3 stub)

**Status:** interface only — `CARE_ADAPTER_STATUS.implemented = false`  
**Code:** [`lib/access/infrastructure/adapters/care/`](../../lib/access/infrastructure/adapters/care/)

## Intent

- Project worker credentials/competencies → `AccessCapability`
- Compile care-request needs from Access Passport (not a second Care accessibility profile)
- Return explainable candidate sets; **never auto-assign**
- Pre-shift purpose-limited disclosure + acknowledgement
- Replacement search uses the same engine; never silent unverified substitute

## Until Phase 3

Continue using existing `lib/matching/matching-service.ts` and `CareAccessNeed` / support-profile paths without claiming Access Infrastructure matching.

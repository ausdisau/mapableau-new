# Venue Mutation Studio

**UI:** [`components/access-intelligence/living/mutation-studio.tsx`](../../components/access-intelligence/living/mutation-studio.tsx)  
**API:** `POST/GET /api/access-intelligence/mutations/preview`  
**Catalogue:** `HARBOUR_MUTATIONS` in `living/harbour-civic.ts`

## Behaviour

- Preview mutations without writing baseline twin data
- Recalculate Access Coverage before/after
- Show evidence required after completion
- **Save draft** → `getLivingPersistence().saveMutationDraft` (memory or Prisma)
- No “Apply to real building” action in this product slice

## Auth

Operate/Improve gates: `requireVenueOperateAccess`. Demo `x-access-role` only when demo mode on; role query param from Living Building hub forwards preview header in demo.

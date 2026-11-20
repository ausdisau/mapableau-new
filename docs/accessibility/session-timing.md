# Session timing (WS8)

## Current design

- NextAuth JWT sessions: **30 days** with 24h sliding `updateAge`.
- No idle timeout, auto-logout, or forced mid-session interrupt.
- `SessionExpiryWarning` shows when expiry is within 48 hours and offers
  “Stay signed in” (`session.update()`) — user-controlled (2.2.4).
- `lib/auth/form-draft.ts` stores drafts in `sessionStorage` so re-auth can
  restore long authoring/booking forms (2.2.5).
- Vite `useAuth` no longer caches `/api/auth/me` with `staleTime: Infinity`.

## WCAG 2.2.1 / 2.2.5

Satisfied-by-design while no idle timeout exists: users are not timed out of
data entry by an automatic short session. If an idle timeout is introduced
later, the warning + draft restore path must remain.

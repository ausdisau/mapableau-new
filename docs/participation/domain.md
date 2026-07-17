# Participation domain model

Wave 17 adds `ParticipationDomain`, privacy levels, community organisations, opportunities, events, access profiles, plans, steps, preferences, boundaries, and reflections.

`ParticipationGoal` remains the canonical goal record. New models link to it through `goalId` where needed. Bookings, calendar events, access places, access assets, access journey plans, consent directives, and AURA execution records are referenced by ID only.

Sensitive domains include faith, advocacy, civic, peer support, and sexuality-related text. These default to `private`.

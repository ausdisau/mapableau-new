# Event access

Event access is stored on `EventAccessProfile` and linked one-to-one with `CommunityEvent`.

Access evidence must include a level, `lastCheckedAt`, optional `validUntil`, uncertainty text, and any linked AccessOps asset IDs. Missing, unknown, stale, or expired access evidence is not treated as accessible.

Access places and assets remain owned by AccessOps. Participation stores references only.

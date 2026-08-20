# MapAble Go — Access Graph

Outdoor path graph is Access-owned. Slice 1 uses labelled sandbox fixture `sandbox-sydney-cbd-pilot`.

Prisma models `AccessPathNode`, `AccessPathSegment`, `AccessTemporaryBarrier` support persistence; routing uses in-memory fixture for G3 proof.

Dynamic barriers expire and are excluded from routing when past `expiresAt`.

# Architecture — Access Intelligence OS / Living Building

## Detected stack
Next.js 15 App Router, React 18, Zod, Prisma 6 (demo in-memory default), NextAuth, AI SDK 6 (`ToolLoopAgent`).

## Invariants
Accessibility is relational. Engines are deterministic. AI narrates only. Unknown is valid. No diagnosis inference. No legal compliance declarations. Chat is optional.

## Living Building twin
`lib/access-intelligence/living/` holds Harbour Civic Centre twin schemas, temporal `getAccessStateAt`, counterfactuals, Access Coverage (≥16 synthetic passports), Decision Mirror, Personal Access Twin, and the Interview L3 flight simulator bridged to `calculatePersonalFit` + `buildAccessibleRoute`.

## Four modes
| Mode | Route |
|------|-------|
| Visit | `/access-intelligence/buildings/[placeId]` + Plan chat |
| Learn | Learning Lab + flight-sim API |
| Operate | `/access-intelligence/operate/[placeId]` |
| Improve | `/access-intelligence/improve/[placeId]` |

All four call the same fit/route/temporal engines.

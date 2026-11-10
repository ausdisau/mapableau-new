# CripSquare integration boundary

Contract version: `2026-11-10.1` (`lib/ecosystem/cripsquare-integration-contract.ts`)

## Allowed (future)

- Versioned TypeScript references from moderated CripSquare discussions to MapAble listing, challenge, place or provider ids.
- Display titles and evidence status labels only.

## Forbidden by default

- Importing community posts, private messages, friendships, diagnosis details or membership records into MapAble.
- Treating forum recommendations as trusted seller endorsements.
- Making community participation a prerequisite for Care, Transport, Employment or Marketplace.

## Federation

`federationEnabled: false` in this tranche. CripSquare remains a separate repository and data boundary.

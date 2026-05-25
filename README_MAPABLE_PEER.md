# MapAble Peer and Social Support Module

MapAble Peer is a consent-aware, moderated peer community - not social media.

## Routes

- Member: `/peer`, `/peer/circles`, `/peer/questions`, `/peer/mentors`, `/peer/events`, `/peer/profile`, `/peer/settings/privacy`
- Mentor: `/peer-mentor`
- Admin: `/admin/peer`

## Environment

- `PEER_MODULE_ENABLED` - set to `false` to disable the module (default: enabled)

## Database

Apply migration `20260607000000_mapable_peer_module` and run `pnpm prisma generate`.

Seed sample circles: import `seedMapablePeer` from `prisma/seed-mapable-peer.ts`.

## API

Peer APIs live under `/api/peer/*` and `/api/admin/peer/*`. All mutations are audited via `createAuditEvent`.

## Design constraints

- No followers, public likes, or popularity leaderboards
- Private usefulness signals only (`PeerContentSignal`)
- Rule-based content scanning with human moderation queue
- Crisis resources and safeguarding escalation to support tickets

# Governed Action Kernel

Participant-controlled, approval-bound execution for MapAble mission action proposals.

**Positioning:** AI proposes → policy validates → participant decides → human review where
required → approval cryptographically/data-bound → deterministic service executes → audit.

This is **not** autonomous execution. Phase 02 actions are request / communication /
preference only — never worker assignment, transport confirmation, payment, employer
disability disclosure, clinical execution, or physical actuation.

## Architecture

```
Mission Runtime action proposal (prepare_*)
        │
        ▼
POST /api/ai/actions/proposals   (MapAbleActionProposal)
        │
        ▼
Policy gate (flags, authority min, consent, payload schema)
        │
        ▼
Participant Action Review (AgencyConfirmation)
        │
        ├── reject → status rejected
        └── approve → ApprovalBinding (payloadHash + nonce)
                │
                ▼
        POST .../execute  (proposalId, approvalId, nonce ONLY)
                │
                ▼
        Replay protection → adapters → domain services → MapAbleActionResult
                │
                ▼
        Mission feedback ("transport request: submitted")
```

Canonical location: `lib/ai/platform/actions/`.

Reuses (does not replace):

| Concern | Existing source |
|---------|-----------------|
| Authority ceilings | `lib/ai/platform/types/authority.ts` |
| Approval binding shape | `lib/ai/platform/human-review/contracts.ts` |
| Payload hash algorithm | CareOS `intelligence/actions/action-envelope.ts` pattern |
| Care / transport services | `lib/care/care-request-service`, `lib/transport/transport-trip-service` |
| Preferences | `intelligence/preferences/preference-service` |
| Messaging | `lib/messages/message-service` |
| Agency UI | `components/personal-agency/AgencyConfirmation` |

## Phase 02 action types

1. `save_participant_preference`
2. `request_human_coordination`
3. `submit_care_request`
4. `submit_transport_request`
5. `send_provider_message`

## Contracts

| Type | Role |
|------|------|
| `MapAbleActionDefinition` | Typed registry entry |
| `MapAbleActionProposal` | Proposal with `payloadHash`, lifecycle status |
| `ApprovalBinding` | Binds `approvalId` to exact `payloadHash`, `nonce`, consent, info-share hash |
| `ActionPolicyDecision` | Allow/deny with reason codes |
| `MapAbleActionResult` | Honest outcome fed back to Mission Runtime |

`effectiveAuthority = min(mission, agent, capability, action, actor)`.

## APIs

| Method | Path | Notes |
|--------|------|-------|
| POST | `/api/ai/actions/proposals` | Create proposal |
| GET | `/api/ai/actions/proposals/:proposalId` | Read proposal |
| POST | `/api/ai/actions/proposals/:proposalId/approve` | Bind approval |
| POST | `/api/ai/actions/proposals/:proposalId/reject` | Reject |
| POST | `/api/ai/actions/proposals/:proposalId/execute` | Execute with ids+nonce only |

## Persistence

Prompt 02 uses in-memory stores for proposals, approvals, nonces, and idempotency
(same pattern as Mission Runtime Prompt 01). Durable secure replay across process
restarts requires a Prisma migration — see **Prompt 02A** below if production durability
is mandated. Process-local replay remains enforced for the running instance.

## Feature flags (fail-closed)

| Flag | Default |
|------|---------|
| `MAPABLE_ACTION_KERNEL_ENABLED` | `false` |
| `MAPABLE_ACTION_SAVE_PREFERENCE_ENABLED` | `false` |
| `MAPABLE_ACTION_HUMAN_COORDINATION_ENABLED` | `false` |
| `MAPABLE_ACTION_CARE_REQUEST_ENABLED` | `false` |
| `MAPABLE_ACTION_TRANSPORT_REQUEST_ENABLED` | `false` |
| `MAPABLE_ACTION_PROVIDER_MESSAGE_ENABLED` | `false` |
| `MAPABLE_ACTION_KERNEL_KILL_SWITCH` | `false` |

## Prompt 02A (if durable replay required)

Suggested model sketch (do **not** weaken in-process replay to avoid migration):

```
model MapAbleActionProposal {
  proposalId     String   @id
  missionId      String
  participantId  String
  actionKey      String
  payloadHash    String
  payloadJson    Json
  status         String
  idempotencyKey String   @unique
  expiresAt      DateTime
  createdAt      DateTime @default(now())
  @@index([missionId])
  @@index([participantId, createdAt])
}

model MapAbleActionApproval {
  approvalId                     String   @id
  proposalId                     String
  payloadHash                    String
  nonce                          String   @unique
  approvedInformationToShareHash String
  actorId                        String
  expiresAt                      DateTime
  createdAt                      DateTime @default(now())
}

model MapAbleActionNonce {
  nonce       String   @id
  consumedAt  DateTime @default(now())
  proposalId  String
  @@index([proposalId])
}

model MapAbleActionIdempotency {
  idempotencyKey String   @id
  resultId       String
  completedAt    DateTime @default(now())
}
```

Retention: align with audit retention; redact payloadJson of sensitive fields per
classification. Privacy: participant-scoped access only.

## Out of scope

Worker assignment, transport confirmation, payment, employer disclosure, clinical
execution, physical actuation, authority ceiling expansion.

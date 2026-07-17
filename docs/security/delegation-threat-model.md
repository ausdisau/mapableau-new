# Threat model — Delegation (Wave 9)

Status: Wave 9. Non-regulator. Amber disclaimer applies.

## Assets

- `DelegateAuthority` rows
- `DelegateAuthorityTransaction` audit trail
- Family / emergency contact records that could be *misinterpreted* as
  authority

## Adversaries

- **Relationship-as-authority attacker.** A family member claims billing
  authority because they are listed as an emergency contact.
- **Self-delegation.** A user tries to create authority "over themselves"
  to escalate.
- **Silent escalation.** A delegate's verification is upgraded without a
  human step.
- **AI approver.** A bot tries to approve a delegate authority.

## Controls

- `delegateId != participantId` invariant enforced in
  `lib/delegation/authority.ts`.
- Authority categories map to verification levels (see
  `docs/federation/wave-9-delegation.md`). Category upgrades require a
  new authority row, never an in-place mutation.
- Every activation and revocation writes a
  `DelegateAuthorityTransaction`.
- AI cannot approve or escalate authority; the `actorId` for approval must
  be a human user (enforced at API layer).
- The Support Coordinator gate (`lib/support-coordinator/consent-gate.ts`)
  requires BOTH an active relationship AND an active consent directive or
  record.

## Residual risk

- If a participant loses capacity, external legal representation via
  `legal_representation` + `legal_instrument_verified` is the only path.
  Wave 9 does not automate this; a human operator must verify the legal
  instrument out of band.

## References

- `lib/delegation/*`, `lib/support-coordinator/consent-gate.ts`,
  `scripts/federation/audit-delegate-authority.ts`

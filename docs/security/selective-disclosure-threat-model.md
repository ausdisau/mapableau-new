# Threat model — Selective disclosure & disclosure gateway (Wave 9)

Status: Wave 9. Non-regulator. Amber disclaimer applies.

## Assets

- Participant PII inside `ParticipantDataPackage` and `PortableClaim`
- `DisclosureManifest` — the single evidence trail for any external egress
- `ConsentDirective` — the authority behind every disclosure
- Bitstring status list state (privacy-critical, see credential threat model)

## Adversaries

- **Bypass caller.** Code that emits participant data straight to an
  external channel without going through `discloseParticipantData`.
- **Purpose creep.** A caller with a directive for "billing" reuses it for
  "marketing".
- **Recipient swap.** A caller with a directive for organisation A
  discloses to organisation B.
- **Field over-disclosure.** A caller passes the whole record when only
  a single field was requested.
- **Correlation via status list.** An attacker uses a per-participant
  public status list URL to fingerprint activity.

## Controls

- `discloseParticipantData` is the mandatory entry point. All disclosure
  code paths go through it.
- Purpose is compared against the directive's `purpose` and `purposeDetail`
  fields; mismatch => `denied`.
- Recipient category is compared against the directive's recipient
  category; mismatch => `denied` or `requires_participant_review`.
- Minimisation planner (`planFieldMinimisation`) computes intersection of
  requested fields and directive-authorised fields; unlisted fields are
  redacted.
- Every disclosure writes a `DisclosureManifest`; every manifest gets an
  audit event; auditors can reconcile counts against
  `audit-disclosure-bypasses` script.
- Status lists private-only by default.
- Simulator flag on every manifest; adapters refuse to transmit real data
  unless activation is on.

## Residual risk

- A caller could go around the gateway entirely. Continuous audit
  (`federation:audit-disclosure-bypasses`) is required to detect this.

## References

- `lib/data-federation/*`, `lib/credentials/status.ts`,
  `scripts/federation/audit-disclosure-bypasses.ts`

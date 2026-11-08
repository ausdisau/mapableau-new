# ACS Stage 0 exact test plan

**Mode:** specify Stage 1 go/no-go negative cases now; keep CI green  
**Synthetic only:** no live participant data  
**Implementation:** [`tests/acs/stage-0-contracts.test.ts`](../../../tests/acs/stage-0-contracts.test.ts) asserts **current** (weak) behaviour and records Stage 1 required outcomes as an unconnected spec.

Stage 1 must flip the spec so every `stage1Required` deny is enforced on the protected-access PEP. Shipping Stage 1 without these cases is a no-go.

## Case catalogue

IDs are stable. Fixtures use synthetic UUIDs (`participant-acs-0`, `tenant-acs-0`, `org-acs-0`).

| ID       | Setup                                                                 | Current (`checkConsent` / harness)     | Stage 1 required                                                                        | Go/no-go           |
| -------- | --------------------------------------------------------------------- | -------------------------------------- | --------------------------------------------------------------------------------------- | ------------------ |
| ACS-N-01 | Active grant, purpose `roster.lookup`; caller purpose `family.notify` | Allow (purpose ignored)                | **Deny** `purpose_mismatch`                                                             | Required           |
| ACS-N-02 | Grant expired                                                         | Deny if expiry in query                | **Deny** `consent_expired`                                                              | Required           |
| ACS-N-03 | Grant revoked                                                         | Deny (status)                          | **Deny** `consent_withdrawn`; next tool call after revoke also deny                     | Required           |
| ACS-N-04 | Newer active grant same scope+purpose                                 | Newest-first accidental allow possible | **Deny** older as `consent_superseded`                                                  | Required           |
| ACS-N-05 | `dataScope` `["rosterStatus"]`; caller requests `clinicalNotes`       | Allow (dataScope ignored)              | **Deny** `fields_insufficient`                                                          | Required           |
| ACS-N-06 | Empty `dataScope` on protected/AI path                                | Navigator treats as unrestricted       | **Deny** `fields_insufficient` (no implicit `*`)                                        | Required           |
| ACS-N-07 | Recipient omitted on protected path                                   | Allow any matching-scope grant         | **Deny** `recipient_required`                                                           | Required           |
| ACS-N-08 | Grant to org A; caller org B                                          | Allow if caller omits org filter       | **Deny** `recipient_mismatch`                                                           | Required           |
| ACS-N-09 | Cross-tenant resource before retrieval                                | No consent-row tenant bind             | **Deny** `tenant_mismatch` before any read                                              | Required           |
| ACS-N-10 | Repeated cross-tenant attempts                                        | No ACS alert                           | Alert **without** disability/capacity profiling                                         | Required           |
| ACS-N-11 | Programme Stop set                                                    | Process-local only                     | Durable Stop; next protected action denied on every instance                            | Required (Stage 1) |
| ACS-N-12 | AURA memory APPROVE after consent revoke                              | Memory can short-circuit               | Memory **must not** approve; live PEP recheck                                           | Required           |
| ACS-N-13 | Temporal/retry duplicate contact                                      | Temporal off                           | Idempotency key + **fresh** consent/Stop check; no duplicate send                       | Interface contract |
| ACS-N-14 | Model attempts `grantConsent` / expand capability                     | Not a unified deny                     | **Deny**; only human/API writers                                                        | Required           |
| ACS-N-15 | AAC silence / camera unavailable                                      | Unmodelled                             | Treat as communication-access failure; **not** consent or incapacity                    | Required           |
| ACS-N-16 | Breakfast fixture: “Do not contact my family”                         | Unenforced                             | Exclusion preserved; unknown attendance stays unknown                                   | Required           |
| ACS-N-17 | Immediate-harm offer                                                  | Unmodelled                             | Configured emergency/human pathway only; no improvised treatment or prohibited contacts | Docs + fixture     |

## Breakfast fixture

[`fixtures/breakfast-scenario.json`](./fixtures/breakfast-scenario.json)

Assert:

1. Expressed goal is independent breakfast with limited packaging help — not inability to eat.
2. Family contact is excluded.
3. Worker status unknown ≠ confirmed absence.
4. Options are participant-reviewable (packaging, authorised backup, editable provider message).
5. Standing instruction to a named backup still requires live PEP (identity, consent revision, time/cost, exclusions) immediately before send.
6. Silence is not permission.

## What Stage 0 tests actually run

Green tests:

- Document that `checkConsent` does not accept `purpose` / `dataScope` / `sourceAction`.
- Simulate current vs Stage 1 outcomes for ACS-N-01, 05–09, 12, 14–16.
- `fingerprintToolCall` hashes tool + payload only (no participant/tenant/policy revision).
- `stopProgrammeAura` is process-local (flag round-trip; no DB).
- Breakfast fixture schema and exclusion flag.

They **must not** fail CI because Stage 1 is unimplemented.

## Stage 1 flip criteria

A later W-ACS-1 PR is green for consent/Stop only when:

1. Every ACS-N-\* deny is produced by the shared protected-access helper, not a test double of current behaviour.
2. Cross-tenant and revoked-consent synthetic negatives are 100% denied.
3. No test grants consent from a model actor.
4. No live data.

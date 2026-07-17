# Replay Lab Safety Boundary

Replay Lab is a **synthetic rehearsal environment**. It is never an operational source of truth.

## Permanent denies

These cannot be enabled by client input, scenario YAML, or partner API parameters:

| Flag / capability | Value |
| --- | --- |
| Production participant data | denied |
| Production domain writes | denied |
| External messages | denied |
| Real payments | denied |
| Real claims | denied |
| Emergency service activation | denied |
| AI release approval | denied |
| Bare universal safety score | denied |

## Namespace

- All simulation events use the `mapable.replay.*` event-type namespace (or explicitly listed synthetic types under that contract).
- Production audit, ledger, Care, Transport, and Billing event namespaces are rejected at validation time.
- Every ledger event carries `synthetic: true`.

## Claims language

Passing a simulation does **not** prove production safety, regulatory certification, NDIS registration, WCAG certification, or policy effectiveness.

Mode watermarks:

- Engineering regression — assertion outcomes only
- Provider exercise — improvement actions; not certification
- Academy — boundaries and debrief; not a perfect-answer ethics grade
- Partner conformance — contract report; not live approval
- Policy — comparative impacts and assumptions only

## Incident-derived scenarios

Raw participant details must never enter fixtures. Only de-identified failure structure after privacy review.

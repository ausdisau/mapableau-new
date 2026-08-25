# ADR-001: Access as Infrastructure

## Status

Accepted (foundation on main via #470; passport/compatibility/UI slice follows).

## Decision

MapAble adopts **Access as Infrastructure (AaI)**.

`mapable.com.au` is the accessible human-facing UI skin over shared access infrastructure.

## Context

Care, Transport, and Jobs must not each invent a separate accessibility profile. Functional access requirements, environmental capabilities, evidence, and deterministic compatibility belong in shared infrastructure. AI may propose observations; it must not own truth or silently convert preferences into restrictions.

## Consequences

Accessibility data becomes:

- participant-controlled;
- functional (not diagnosis-led);
- contextual;
- evidence-backed;
- reusable across services;
- privacy-bound;
- explainable.

Care, Transport, and Jobs consume shared infrastructure rather than creating duplicate profiles.

AI produces candidate observations. Deterministic systems govern compatibility. The participant remains the decision owner (`decisionOwner: "PARTICIPANT"`).

## Ownership (constitution)

| Concept | Owner |
| --- | --- |
| Presentation preferences | `AccessibilityProfile` |
| Functional requirements | `AccessPassport` (C-010) |
| Place identity | `AccessPlace` (C-011) |
| Compatibility decision | Participant |

## Non-goals (this ADR)

- Universal accessibility scores
- Disability / employability / vulnerability scoring
- Facial recognition or diagnosis inference
- Auto-assignment of workers or auto-rejection of job candidates
- Production enablement of Omni Intelligence without separate approval

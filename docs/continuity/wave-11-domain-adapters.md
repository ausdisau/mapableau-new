# Wave 11 — Domain adapters

Adapters bridge existing operational systems to the continuity graph without duplicating them.

| Adapter | Emits | Notes |
|---|---|---|
| `care-adapter` | `care_shift_cancelled` | Care cancellation opens a continuity case; it does NOT auto-cancel linked transport. |
| `transport-adapter` | `transport_booking_cancelled` | Symmetric — transport cancellation opens a case; care is not auto-cancelled. |
| `appointments-adapter` | `other` (non-clinical only) | Clinical appointments are out of scope; `emitAppointmentDisruptedSignal` throws for clinical labels. |
| `employment-adapter` | `other` (employment) | Employment continuity always requires a human coordinator. |
| `housing-adapter` | `other` (housing) | Housing continuity always requires a delegate / human coordinator. |
| `provider-failure` | `provider_failure` | Substitution requires coordinator approval. |
| `finance-recovery` (guard only) | — | Refuses any financial approval action; explain-and-hand-off. |

Adapters DO NOT mutate operational status. They only emit signals.
